# Importar bibliotecas necessárias
import pandas as pd
import requests
import time
import json
import warnings

# Suprimir avisos de "UserWarning"
warnings.filterwarnings('ignore', category=UserWarning)

# ==============================================================================
# 0. CONFIGURAÇÃO DA API (Have I Been Pwned - HIBP)
# ==============================================================================
headers = {
    'User-Agent': 'Project-Aegis-Coletor-Academico'
}
API_URL = "https://haveibeenpwned.com/api/v3/breaches"
SLEEP_TIME = 2

print("="*80)
print("ATRIBUIÇÃO: Usando a Base de Dados 'Have I Been Pwned' (HIBP) v3.")
print("="*80 + "\n")

# ==============================================================================
# 1. DICIONÁRIO DE DADOS (NOSSO ALVO)
# ==============================================================================
dicionario_dados_vazamento = {
    "nome_vazamento": "String (Nome da empresa/site, ex: 'SocialNet')",
    "data_vazamento": "Date (Data em que o vazamento ocorreu)",
    "contas_afetadas": "Integer (Número total de contas vazadas)",
    "setor": "String (Indústria da empresa, ex: 'Technology')"
}
print("--- 1. ESTRUTURA DO DICIONÁRIO DE DADOS (NOSSO ALVO) ---")
for chave, valor in dicionario_dados_vazamento.items():
    print(f"{chave}: {valor}")
print("\n" + "="*50 + "\n")


# ==============================================================================
# 2. COLETA REAL DE DADOS (ETL)
# ==============================================================================
print("--- 2. COLETANDO DADOS REAIS DA API DO HIBP ---")

dados_coletados = []
df = pd.DataFrame()

try:
    print(f"Buscando lista completa de vazamentos em {API_URL}...")
    response = requests.get(API_URL, headers=headers, timeout=15)
    
    print(f"Aguardando {SLEEP_TIME} segundos (Rate Limit)...")
    time.sleep(SLEEP_TIME)
    
    if response.status_code == 200:
        vazamentos = response.json()
        print(f"Sucesso! {len(vazamentos)} vazamentos catalogados encontrados.")
        
        for item in vazamentos:
            dados_coletados.append({
                "nome_vazamento": item.get('Name'),
                "data_vazamento": item.get('BreachDate'),
                "contas_afetadas": item.get('PwnCount', 0),
                "setor": item.get('Industry', 'N/A')
            })
            
    elif response.status_code == 403:
         print(f"Erro API: {response.status_code} (Forbidden)")
    else:
        print(f"Erro API: {response.status_code}")

except Exception as e:
    print(f"Erro durante a coleta HIBP: {e}")


# --- ETAPA DE CARGA (L) ---
df = pd.DataFrame(dados_coletados)

if df.empty:
    print("\nAVISO: O DataFrame está vazio.")
else:
    print(f"\n--- AMOSTRA DO DATASET (Total: {len(df)} registros) ---")
    # Converter data e números
    df['data_vazamento'] = pd.to_datetime(df['data_vazamento'], errors='coerce')
    df['contas_afetadas'] = pd.to_numeric(df['contas_afetadas'])
    print(df.head())

    print("\n" + "="*50 + "\n")

    # ==============================================================================
    # 3. EXPORTAR DADOS COMPLETOS PARA O FRONT-END
    # ==============================================================================
    print("--- 3. EXPORTANDO DADOS COMPLETOS PARA O DASHBOARD ---")

    # Converter data para STRING (YYYY-MM-DD) antes de salvar no JSON
    # Isso evita o erro "Timestamp is not JSON serializable"
    df['data_vazamento'] = df['data_vazamento'].dt.strftime('%Y-%m-%d')
    
    # Converter para lista de dicionários (JSON puro)
    dados_para_json = df.to_dict('records')

    try:
        with open("hibp_kpis.json", "w", encoding="utf-8") as f:
            json.dump(dados_para_json, f, ensure_ascii=False)
        print(f"Arquivo 'hibp_kpis.json' gerado com sucesso com {len(dados_para_json)} registros.")
    except Exception as e:
        print(f"Erro ao salvar arquivo JSON: {e}")