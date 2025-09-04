"""
Este script consome a API oficial da NVD (National Vulnerability Database) 
para obter informações sobre vulnerabilidades conhecidas (CVEs).

📌 O que é a NVD?
A NVD é mantida pelo NIST (EUA) e centraliza dados sobre falhas de segurança 
reportadas publicamente. Cada vulnerabilidade é identificada por um CVE ID 
(ex: CVE-2024-12345) e descrita com informações técnicas, impacto e referências.

📌 Como a API funciona?
- Base URL: https://services.nvd.nist.gov/rest/json/cves/2.0
- Retorna dados em formato JSON estruturado.
- Principais parâmetros de consulta:
    • keywordSearch  → busca por palavra-chave (ex: "wordpress", "apache", "php")
    • cvssV3Severity → filtra vulnerabilidades por severidade (LOW, MEDIUM, HIGH, CRITICAL)
    • pubStartDate / pubEndDate → busca por intervalo de datas (formato: YYYY-MM-DDTHH:MM:SS:000 UTC-00:00)
    • cveId → consulta direta por um CVE específico
    • resultsPerPage → controla o número de resultados por página
    • startIndex → paginação para grandes volumes de dados

📌 Estrutura resumida da resposta JSON:
{
  "resultsPerPage": 10,
  "totalResults": 123,
  "vulnerabilities": [
    {
      "cve": {
        "id": "CVE-2024-12345",
        "descriptions": [{"lang": "en", "value": "Descrição da falha..."}],
        "metrics": {
          "cvssMetricV31": [
            {"cvssData": {"baseSeverity": "HIGH", "baseScore": 7.5}}
          ]
        },
        "references": [{"url": "https://example.com/patch"}]
      }
    }
  ]
}

📌 O que este código faz:
1. Conecta à API NVD e faz uma consulta por palavra-chave e severidade.
2. Extrai os principais campos de cada CVE:
   - CVE ID
   - Severidade e Score CVSS
   - Descrição da vulnerabilidade
   - URL de referência
3. Organiza os dados em um DataFrame (tabela) usando Pandas.
4. Salva os resultados em um arquivo JSON local ("vulnerabilidades.json").

"""

"""
Script aprimorado para consumir a API da NVD (National Vulnerability Database)
e extrair informações sobre vulnerabilidades conhecidas (CVEs).

Funcionalidades:
- Busca por palavra-chave e severidade
- Filtro por ano
- Retry automático em caso de falha na requisição
- Paginação automática para capturar todos os resultados
- Exporta dados para JSON e CSV
- Gera relatório resumido por severidade

📌 Exemplo de uso:
    get_cves(keyword="Linux", severity="CRITICAL", year=2025)
"""

import requests
import pandas as pd
from datetime import datetime, timedelta
import time

NVD_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"

def request_with_retry(url, params, max_retries=3, delay=2):
    """Requisição HTTP com retry"""
    for attempt in range(max_retries):
        r = requests.get(url, params=params)
        if r.status_code == 200:
            return r.json()
        else:
            print(f"Tentativa {attempt+1} falhou: {r.status_code}")
            time.sleep(delay)
    print("Falha após várias tentativas.")
    return None

def generate_date_ranges(year, max_days=120):
    """Divide o ano em blocos de no máximo 120 dias"""
    start = datetime(year, 1, 1)
    end = datetime(year, 12, 31)
    ranges = []
    current_start = start
    while current_start <= end:
        current_end = min(current_start + timedelta(days=max_days-1), end)
        ranges.append((current_start, current_end))
        current_start = current_end + timedelta(days=1)
    return ranges

def get_cves(keyword="", severity="", year=None, results_per_page=2000):
    all_vulns = []

    date_ranges = generate_date_ranges(year) if year else [(None, None)]

    for start_date, end_date in date_ranges:
        start_index = 0
        while True:
            params = {
                "keywordSearch": keyword,
                "cvssV3Severity": severity,
                "resultsPerPage": results_per_page,
                "startIndex": start_index
            }
            if start_date:
                params["pubStartDate"] = start_date.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            if end_date:
                params["pubEndDate"] = end_date.strftime("%Y-%m-%dT%H:%M:%S.999Z")

            data = request_with_retry(NVD_URL, params)
            if not data:
                break

            items = data.get("vulnerabilities", [])
            if not items:
                break

            for item in items:
                cve = item["cve"]
                cve_id = cve.get("id", "N/A")
                descricao = cve.get("descriptions", [{"value":"N/A"}])[0]["value"]

                metrics = cve.get("metrics", {}).get("cvssMetricV31") or cve.get("metrics", {}).get("cvssMetricV30") or []
                if metrics:
                    severidade_cve = metrics[0]["cvssData"].get("baseSeverity", "N/A")
                    score = metrics[0]["cvssData"].get("baseScore", "N/A")
                else:
                    severidade_cve, score = "N/A", "N/A"

                url_ref = cve.get("references", [{"url":"N/A"}])[0]["url"]

                all_vulns.append([cve_id, severidade_cve, score, descricao, url_ref])

            start_index += len(items)
            total_results = data.get("totalResults", 0)
            if start_index >= total_results:
                break

            time.sleep(0.6)  # para evitar rate limit

    df = pd.DataFrame(all_vulns, columns=["CVE_ID", "Severidade", "Score", "Descrição", "Referência"])

    if year:
        df.to_json(f"vulnerabilidades_{year}.json", orient="records", indent=4, force_ascii=False)
        df.to_csv(f"vulnerabilidades_{year}.csv", index=False)
    else:
        df.to_json(f"vulnerabilidades.json", orient="records", indent=4, force_ascii=False)
        df.to_csv(f"vulnerabilidades.csv", index=False)

    resumo = df.groupby("Severidade")["CVE_ID"].count()
    print("✅ Dados salvos com sucesso")
    print("\n📊 Resumo de CVEs por Severidade:")
    print(resumo)

    return df

# Exemplo de execução
if __name__ == "__main__":
    df_criticos = get_cves(keyword="Linux", severity="CRITICAL", year=2025, results_per_page=20)
