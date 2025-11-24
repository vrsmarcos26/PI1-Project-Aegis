# Importar bibliotecas necessárias
import pandas as pd
import requests
import json
from datetime import datetime, timedelta
import time 

# ==============================================================================
# 0. CONFIGURAÇÃO DA API (AlienVault OTX)
# ==============================================================================
API_KEY = "6dc4519f2fe20cb267b376d6f626b0ee64243693f27d30109f3e6b1802e78c2d" 

if "SUA_CHAVE_OTX_AQUI" in API_KEY:
    print("ERRO: Adicione sua chave de API da OTX.")
    exit()

headers = {
    'X-OTX-API-KEY': API_KEY
}

# Usando /subscribed pois mostrou-se mais estável que /activity
API_URL = "https://otx.alienvault.com/api/v1/pulses/subscribed"

# Configurações de Coleta
RESULTS_PER_PAGE = 50
MAX_PAGES = 200 # Limite de segurança para não rodar infinito (200 * 50 = 10.000 pulsos)
DIAS_PARA_BUSCAR = 365 # Queremos 1 ano de dados

print("="*80)
print("ATRIBUIÇÃO: Usando a Base de Dados 'AlienVault OTX' (Open Threat Exchange).")
print("="*80 + "\n")

# ==============================================================================
# 1. COLETA REAL DE DADOS (ETL - 365 DIAS)
# ==============================================================================
print("--- 2. COLETANDO DADOS REAIS DA API DA OTX (Janela de 1 Ano) ---")

# Calcular a data limite (1 ano atrás)
data_limite = datetime.now() - timedelta(days=DIAS_PARA_BUSCAR)
print(f"Buscando dados a partir de: {data_limite.strftime('%Y-%m-%d')}")

dados_coletados = []
parar_coleta = False

try:
    # Loop de Paginação
    for page in range(1, MAX_PAGES + 1):
        if parar_coleta:
            break

        PARAMS = {
            'limit': RESULTS_PER_PAGE,
            'page': page
        }
        
        print(f"Buscando página {page}... ({len(dados_coletados)} pulsos coletados)")
        
        try:
            response = requests.get(API_URL, headers=headers, params=PARAMS, timeout=20)
            
            if response.status_code == 200:
                data = response.json()
                pulsos = data.get('results', [])
                
                if not pulsos:
                    print("Fim dos resultados da API.")
                    break 

                for pulso in pulsos:
                    # Pegar a data de criação
                    created_str = pulso.get('created', '')
                    # OTX retorna data assim: '2025-11-18T10:30:00.000'
                    try:
                        # Converter string para objeto data para comparar
                        data_pulso = datetime.strptime(created_str.split('.')[0], "%Y-%m-%dT%H:%M:%S")
                    except:
                        continue # Se não tem data, ignora
                    
                    # Se o pulso for mais antigo que 1 ano, paramos TUDO.
                    if data_pulso < data_limite:
                        print(f"Atingimos a data limite ({data_pulso}). Parando coleta.")
                        parar_coleta = True
                        break
                    
                    # Se a data for válida, coletamos os dados
                    # 1. Setores
                    setores = pulso.get('industries', [])
                    
                    # 2. Tags (Ameaças)
                    tags = pulso.get('tags', [])
                    
                    # 3. Países (Direto do objeto pulso, como descobrimos)
                    paises = pulso.get('countries', [])
                    
                    dados_coletados.append({
                        "data_criacao": created_str.split('T')[0], # Salva YYYY-MM-DD
                        "setores": setores,
                        "ameacas": tags,
                        "paises": paises
                    })
            
                # Rate limit
                time.sleep(1.5)

            elif response.status_code == 403:
                print(f"Erro 403: Chave de API inválida ou expirada.")
                break 
            else:
                print(f"Erro API: {response.status_code}")
                break 
                
        except Exception as e:
            print(f"Erro na requisição: {e}")
            break

    print(f"\nSucesso! {len(dados_coletados)} pulsos coletados no período de 1 ano.")

except Exception as e:
    print(f"Erro geral: {e}")

print("\n" + "="*50 + "\n")

# ==============================================================================
# 3. EXPORTAR DADOS BRUTOS PARA O FRONT-END
# ==============================================================================
if dados_coletados:
    print("--- 3. EXPORTANDO DADOS COMPLETOS PARA O DASHBOARD ---")
    
    try:
        # Salvamos a LISTA BRUTA. O JavaScript vai fazer a contagem (Counter).
        with open("otx_kpis.json", "w", encoding="utf-8") as f:
            json.dump(dados_coletados, f, ensure_ascii=False)
        print("Arquivo 'otx_kpis.json' gerado com sucesso!")
        
        # Preview para você ver no terminal
        print(f"Exemplo de dado exportado: {dados_coletados[0]}")
        
    except Exception as e:
        print(f"Erro ao salvar arquivo JSON: {e}")
        
else:
    print("Nenhum dado coletado. Verifique a API.")