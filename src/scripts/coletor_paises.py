# Importar bibliotecas necessárias
import pandas as pd
import requests
import json
import time
from datetime import datetime
import os

# ==============================================================================
# 0. CONFIGURAÇÃO DA API (AbuseIPDB)
# ==============================================================================
API_KEY = os.getenv("API_ABUSEIPDB")

if not API_KEY:
    print("ERRO: Chave API_ABUSEIPDB não encontrada.")
    exit() 

headers = {
    'Key': API_KEY,
    'Accept': 'application/json',
}
API_URL = "https://api.abuseipdb.com/api/v2/blacklist"
# Limitamos a 10.000 IPs (máximo gratuito)
PARAMS = {
    'confidenceMinimum': 50,
    'limit': 10000
}

# --- DICIONÁRIO DE MAPEAMENTO (Country Code -> Country Name) ---
COUNTRY_MAP = {
    "US": "United States", "CN": "China", "RU": "Russia", "DE": "Germany",
    "NL": "Netherlands", "FR": "France", "GB": "United Kingdom",
    "IN": "India", "BR": "Brazil", "VN": "Vietnam", "UA": "Ukraine",
    "KR": "South Korea", "JP": "Japan", "CA": "Canada", "AU": "Australia",
    "PL": "Poland", "TR": "Turkey", "HK": "Hong Kong", "SG": "Singapore",
    "TW": "Taiwan", "IR": "Iran", "RO": "Romania", "CZ": "Czech Republic",
    "ID": "Indonesia", "ES": "Spain", "IT": "Italy", "TH": "Thailand"
}

print("="*80)
print("ATRIBUIÇÃO: Usando a Base de Dados 'AbuseIPDB'.")
print("="*80 + "\n")

# ==============================================================================
# 1. DICIONÁRIO DE DADOS (NOSSO ALVO)
# ==============================================================================
dicionario_dados_paises = {
    "pais_origem": "String (País de origem do IP)",
    "data_report": "Date (Data do último reporte de abuso)",
    "confidence": "Integer (Nível de certeza de abuso)"
}
print("--- 1. ESTRUTURA DO DICIONÁRIO DE DADOS (NOSSO ALVO) ---")
for chave, valor in dicionario_dados_paises.items():
    print(f"{chave}: {valor}")
print("\n" + "="*50 + "\n")


# ==============================================================================
# 2. COLETA REAL DE DADOS (ETL)
# ==============================================================================
print("--- 2. COLETANDO DADOS REAIS DA API DA AbuseIPDB ---")

dados_coletados = []

try:
    print(f"Buscando a blacklist de IPs maliciosos de {API_URL}...")
    response = requests.get(API_URL, headers=headers, params=PARAMS, timeout=20)
    
    if response.status_code == 200:
        data = response.json().get('data', [])
        
        if not data:
            print("Nenhum IP malicioso encontrado.")
        else:
            print(f"Sucesso! {len(data)} IPs maliciosos recebidos.")

            # --- ETAPA DE TRANSFORMAÇÃO (T) ---
            for ip_info in data:
                code = ip_info.get('countryCode', None)
                # A API retorna data assim: "2025-11-18T15:30:00+00:00"
                last_reported = ip_info.get('lastReportedAt', None)
                
                if code:
                    # Mapear código para nome
                    pais = COUNTRY_MAP.get(code, code)
                    
                    # Limpar a data (pegar só YYYY-MM-DD)
                    data_limpa = "N/A"
                    if last_reported:
                         data_limpa = last_reported.split('T')[0]

                    dados_coletados.append({
                        "pais": pais,
                        "data_report": data_limpa,
                        "ip": ip_info.get('ipAddress') # Opcional, para referência
                    })

    elif response.status_code == 403:
        print(f"Erro 403: Verifique sua chave de API.")
    elif response.status_code == 429:
        print(f"Erro 429: Limite de requisições diárias atingido.")
    else:
        print(f"Erro API: {response.status_code} - {response.text}")

except Exception as e:
    print(f"Erro na coleta: {e}")

print("\n" + "="*50 + "\n")

# ==============================================================================
# 3. EXPORTAR DADOS BRUTOS PARA O FRONT-END
# ==============================================================================
if dados_coletados:
    print("--- 3. EXPORTANDO DADOS COMPLETOS PARA O DASHBOARD ---")
    
    caminho_arquivo = os.path.join("site", "paises_kpis.json")

    try:
        # Salvamos a lista bruta de objetos {pais, data}
        with open(caminho_arquivo, "w", encoding="utf-8") as f:
            json.dump(dados_coletados, f, ensure_ascii=False)
        print("Arquivo 'paises_kpis.json' gerado com sucesso!")
        
        if len(dados_coletados) > 0:
             print(f"Exemplo: {dados_coletados[0]}")
        
    except Exception as e:
        print(f"Erro ao salvar arquivo JSON: {e}")
        
else:
    print("Nenhum dado coletado.")