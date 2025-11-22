import pandas as pd
import requests  # Para fazer requisições web (chamar a API)
from datetime import datetime, timedelta
import time  # Para o "sleep" recomendado pela API
import matplotlib.pyplot as plt

# ==============================================================================#
# 0. CONFIGURAÇÃO DA API e ATRIBUIÇÃO
# ==============================================================================#
API_KEY = "*******************"
headers = {'apiKey': API_KEY}

print("="*80)
print("ATRIBUIÇÃO: Este produto usa dados da NVD API, mas não é endossado ou certificado pela NVD.")
print("="*80 + "\n")

# ==============================================================================#
# 1. DICIONÁRIO DE DADOS (NOSSO OBJETIVO)
# ==============================================================================#
dicionario_dados_cve = {
    "cve_id": "String (Identificador único, ex: CVE-2025-1234)",
    "data_publicacao": "Date (Data em que foi revelada)",
    "cvss_score": "Float (Nota de severidade de 0.0 a 10.0)",
    "severidade": "String (Calculada baseada no score: Baixa, Média, Alta, Crítica)",
    "descricao": "String (Resumo da vulnerabilidade)",
}

print("--- 1. ESTRUTURA DO DICIONÁRIO DE DADOS (NOSSO ALVO) ---")
for chave, valor in dicionario_dados_cve.items():
    print(f"{chave}: {valor}")
print("\n" + "="*50 + "\n")

# ==============================================================================#
# 2. COLETA REAL DE DADOS (ETL - EXTRACT & TRANSFORM)
# ==============================================================================#
print("--- 2. COLETANDO DADOS REAIS DA API DO NIST (NVD) ---")

# Definir o período que queremos: últimos 30 dias
data_final = datetime.now()
data_inicial = data_final - timedelta(days=30)
fmt_data_inicial = data_inicial.strftime('%Y-%m-%dT%H:%M:%SZ')
fmt_data_final = data_final.strftime('%Y-%m-%dT%H:%M:%SZ')

print(f"Buscando CVEs publicadas entre {fmt_data_inicial} e {fmt_data_final}...")

API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
dados_coletados = []
startIndex = 0
totalResults = 0
resultsPerPage = 2000

while True:
    params = {
        'pubStartDate': fmt_data_inicial,
        'pubEndDate': fmt_data_final,
        'resultsPerPage': resultsPerPage,
        'startIndex': startIndex
    }

    print(f"Buscando... (Índice inicial: {startIndex})")

    try:
        response = requests.get(API_URL, headers=headers, params=params, timeout=15)

        if response.status_code == 200:
            data = response.json()

            if startIndex == 0:
                totalResults = data.get('totalResults', 0)
                if totalResults == 0:
                    print("Nenhuma vulnerabilidade encontrada para o período.")
                    break
                print(f"Sucesso! Total de {totalResults} vulnerabilidades encontradas.")

            vulnerabilidades = data.get('vulnerabilities', [])

            # --- ETAPA DE TRANSFORMAÇÃO (T) ---
            for item in vulnerabilidades:
                cve = item.get('cve', {})
                cve_id = cve.get('id', 'N/A')
                data_publicacao = cve.get('published', 'N/A')

                try:
                    descricao = cve['descriptions'][0]['value']
                except:
                    descricao = "Descrição não disponível."

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
                        "data_publicacao": data_publicacao,
                        "cvss_score": cvss_score,
                        "severidade": severidade,
                        "descricao": descricao
                    })

            startIndex += resultsPerPage
            if startIndex >= totalResults:
                print("Coleta de todas as páginas concluída.")
                break

            print("Aguardando 6 segundos antes da próxima requisição (Rate Limit)...")
            time.sleep(6)

        else:
            print(f"Erro ao chamar a API: Status Code {response.status_code}")
            print(f"Mensagem: {response.text}")
            break

    except requests.exceptions.Timeout:
        print("Erro: A API da NVD demorou muito para responder (Timeout).")
        break
    except requests.exceptions.RequestException as e:
        print(f"Erro de conexão com a API: {e}")
        break

# Carregar no DataFrame do Pandas
df = pd.DataFrame(dados_coletados)

if df.empty:
    print("\nAVISO: O DataFrame está vazio. A análise de KPIs será pulada.")
else:
    print(f"\n--- AMOSTRA DO DATASET REAL (Total de {len(df)} registros limpos) ---")
    print(df.head())
    df['cvss_score'] = pd.to_numeric(df['cvss_score'])

# ==============================================================================#
# 3. QUANTITATIVO E KPIs (ANÁLISE DOS DADOS)
# ==============================================================================#
if not df.empty:
    print("--- 3. QUANTITATIVO DE DADOS REAIS (KPIs PARA O DASHBOARD) ---")

    total_vulns = df.shape[0]
    print(f"Total de Vulnerabilidades (com score V3.1): {total_vulns}")

    # Distribuição por Severidade (para gráfico)
    contagem_severidade = df['severidade'].value_counts()
    print("\n[KPI] Distribuição por Severidade:")
    print(contagem_severidade)

    # Média de CVSS
    media_score = df['cvss_score'].mean()
    print(f"\n[Estatística] Média Geral de CVSS: {media_score:.2f}")

    # Vulnerabilidade mais crítica
    df_criticas = df.sort_values(by='cvss_score', ascending=False)
    top_10_criticas = df_criticas.head(10)

    print("\n[KPI] As 10 vulnerabilidades mais críticas dos últimos 30 dias:")  #KPI 10 MAIS CRITICAS PRINT NO TERMINAL

    for index, vuln in top_10_criticas.iterrows():
        print(f"\nID: {vuln['cve_id']}")
        print(f"Score: {vuln['cvss_score']}")
        print(f"Descrição: {vuln['descricao'][:70]}...")

else:
    print("--- 3. Análise de KPIs pulada (nenhum dado foi coletado) ---")

# ==============================================================================#
# 4. GRAFICOS (Distribuição de Severidade e Média de CVSS)
# ==============================================================================#

# Gráfico de Rosca (Distribuição de Severidade (KPI!!)
plt.figure(figsize=(8, 6))
plt.pie(contagem_severidade, labels=contagem_severidade.index, autopct='%1.1f%%', startangle=90, wedgeprops={'width': 0.4})
plt.title('Distribuição por Severidade das Vulnerabilidades')
plt.axis('equal')
plt.show()

# Gráfico de Barra (Média de CVSS) (CONCERTAR)
plt.figure(figsize=(6, 4))
plt.bar('Média de CVSS', media_score, color='skyblue')
plt.ylim(0, 10)
plt.title(f'Média de CVSS: {media_score:.2f}')
plt.ylabel('CVSS Score')
plt.show()

# Gráfico das 10 vulnerabilidades mais críticas (KPI!!)
plt.figure(figsize=(12, 6))
plt.bar(top_10_criticas['cve_id'], top_10_criticas['cvss_score'], color='red')
plt.xticks(rotation=90)  # Rotaciona os IDs para melhor leitura
plt.title('Top 10 Vulnerabilidades Mais Críticas')
plt.ylabel('CVSS Score')
plt.show()
