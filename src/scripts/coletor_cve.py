# Importar bibliotecas necessárias
import pandas as pd
import requests
from datetime import datetime, timedelta
import time
import json
import os

# ==============================================================================
# 0. CONFIGURAÇÃO DA API (NVD)
# ==============================================================================
API_KEY = os.getenv("API_NVD_CVE")
API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
headers = {'apiKey': API_KEY}

# --- FUNÇÃO DE CLASSIFICAÇÃO ---
def classificar_vulnerabilidade(descricao):
    """
    Lê a descrição técnica e retorna uma categoria simplificada.
    """
    if not descricao:
        return 'Outros'
        
    desc = descricao.lower()
    
    if 'remote code execution' in desc or 'execute arbitrary code' in desc:
        return 'RCE (Execução Remota)'
    elif 'denial of service' in desc or 'dos' in desc:
        return 'DoS (Negação de Serviço)'
    elif 'sql injection' in desc:
        return 'SQL Injection'
    elif 'cross-site scripting' in desc or 'xss' in desc:
        return 'XSS'
    elif 'privilege escalation' in desc or 'gain privileges' in desc:
        return 'Escalada de Privilégio'
    elif 'buffer overflow' in desc:
        return 'Buffer Overflow'
    else:
        return 'Outros'

print("="*80)
print("ATRIBUIÇÃO: Este produto usa dados da NVD API, mas não é endossado ou certificado pela NVD.")
print("="*80 + "\n")

# ==============================================================================
# 1. COLETA REAL DE DADOS (365 DIAS)
# ==============================================================================
print("--- 2. COLETANDO DADOS REAIS DA API DO NIST (NVD) ---")

# Vamos buscar 1 ano de dados para permitir filtragem no frontend
DIAS_PARA_BUSCAR_TOTAL = 365
DIAS_POR_CHAMADA = 120 # Limite da API NVD
dados_coletados = []

data_final_global = datetime.now()
data_limite_total = data_final_global - timedelta(days=DIAS_PARA_BUSCAR_TOTAL)

# Loop para buscar em blocos de 120 dias (0 a 3)
for i in range(0, (DIAS_PARA_BUSCAR_TOTAL // DIAS_POR_CHAMADA) + 1):
    
    start_index = 0
    
    # Calcula janela de tempo
    data_final_janela = data_final_global - timedelta(days=i * DIAS_POR_CHAMADA)
    data_inicial_janela = data_final_global - timedelta(days=(i + 1) * DIAS_POR_CHAMADA)
    
    if data_inicial_janela < data_limite_total:
        data_inicial_janela = data_limite_total

    if data_final_janela < data_limite_total:
        break
        
    fmt_data_inicial = data_inicial_janela.strftime('%Y-%m-%dT%H:%M:%SZ')
    fmt_data_final = data_final_janela.strftime('%Y-%m-%dT%H:%M:%SZ')
        
    print(f"\nBuscando bloco {i+1}: de {fmt_data_inicial} até {fmt_data_final}...")
    
    PAGE_SIZE = 2000
    total_vulns_bloco = 0

    while True:
        params = {
            'pubStartDate': fmt_data_inicial,
            'pubEndDate': fmt_data_final,
            'resultsPerPage': PAGE_SIZE,
            'startIndex': start_index
        }
        
        print(f"  - Buscando índice {start_index}...")
        
        try:
            response = requests.get(API_URL, params=params, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                vulnerabilidades = data.get('vulnerabilities', [])
                
                if start_index == 0:
                    total_vulns_bloco = data.get('totalResults', 0)
                    print(f"    Sucesso! {total_vulns_bloco} vulnerabilidades neste bloco.")
                
                if not vulnerabilidades:
                    break 

                for item in vulnerabilidades:
                    cve = item.get('cve', {})
                    cve_id = cve.get('id', 'N/A')
                    data_publicacao = cve.get('published', 'N/A')
                    
                    # Extrair descrição para classificar
                    descricao = "N/A"
                    try:
                        descricao = cve['descriptions'][0]['value']
                    except:
                        pass
                    
                    # Classificar
                    tipo_falha = classificar_vulnerabilidade(descricao)

                    cvss_score = None
                    severidade = "N/A"
                    
                    metrics = cve.get('metrics', {})
                    if 'cvssMetricV31' in metrics:
                        try:
                            metric_data = metrics['cvssMetricV31'][0]['cvssData'] 
                            cvss_score = metric_data.get('baseScore')
                            severidade = metric_data.get('baseSeverity', 'N/A')
                        except:
                            pass
                    
                    if cvss_score is not None:
                        dados_coletados.append({
                            "cve_id": cve_id,
                            "data_publicacao": data_publicacao.split('T')[0], 
                            "cvss_score": cvss_score,
                            "severidade": severidade,
                            "tipo_falha": tipo_falha # Novo campo
                        })
                
                start_index += PAGE_SIZE
                
                if start_index >= total_vulns_bloco:
                    break
                
                print(f"    Aguardando 2s (Rate Limit)...")
                time.sleep(2)
            else:
                print(f"    Erro API: {response.status_code}")
                break
        except Exception as e:
            print(f"    Erro conexão: {e}")
            break
            
    if data_inicial_janela <= data_limite_total:
        break
    
    print(f"  Aguardando 4s entre blocos...")
    time.sleep(4)


# --- ETAPA DE CARGA (L) ---
df = pd.DataFrame(dados_coletados)

if df.empty:
    print("\nAVISO: O DataFrame está vazio.")
else:
    print(f"\n--- AMOSTRA DO DATASET (Total: {len(df)} registros de 1 ano) ---")
    print(df[['cve_id', 'severidade', 'tipo_falha']].head())

    print("\n--- 4. EXPORTANDO DADOS COMPLETOS PARA O FRONT-END ---")
    
    # Converter para lista de dicionários
    dados_para_json = df.to_dict('records')

    caminho_arquivo = os.path.join("site", "cve_kpis.json")
    
    try:
        with open(caminho_arquivo, "w", encoding="utf-8") as f:
            json.dump(dados_para_json, f, ensure_ascii=False) 
        print(f"Arquivo 'cve_kpis.json' gerado com sucesso!")
    except Exception as e:
        print(f"Erro ao salvar arquivo JSON: {e}")