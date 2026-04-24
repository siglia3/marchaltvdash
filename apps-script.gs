var SHEETS = {
  BASE_CLIENTES: "BASE_CLIENTES",
  MOVIMENTACAO_MENSAL: "MOVIMENTACAO_MENSAL",
  SAIDAS: "SAIDAS"
};

function doGet() {
  var payload = buildDashboardPayload_();
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function buildDashboardPayload_() {
  var baseClientes = getSheetData_(SHEETS.BASE_CLIENTES);
  var movimentacao = getSheetData_(SHEETS.MOVIMENTACAO_MENSAL);
  var saidas = getSheetData_(SHEETS.SAIDAS);
  var hoje = new Date();

  var clientesAtivosValidos = baseClientes.filter(function (row) {
    return normalizeText_(row["ATIVO"]) === "sim" && normalizeSaude_(row["Saúde cliente"]) !== "";
  });

  var statusCounts = { bons: 0, alerta: 0, critico: 0 };
  var ltvValoresAtivos = [];

  clientesAtivosValidos.forEach(function (row) {
    var saude = normalizeSaude_(row["Saúde cliente"]);
    if (saude === "bom") statusCounts.bons += 1;
    if (saude === "alerta") statusCounts.alerta += 1;
    if (saude === "critico") statusCounts.critico += 1;

    var ltv = resolveLtvMeses_(row, hoje);
    if (ltv !== null) ltvValoresAtivos.push(ltv);
  });

  var evolucaoMensal = buildEvolucaoMensal_(movimentacao);
  var churnLookup = {};
  evolucaoMensal.forEach(function (item) {
    churnLookup[item.key] = {
      churn: item.churn,
      parcial: item.parcial
    };
  });

  var churnFechado = evolucaoMensal
    .filter(function (item) {
      return item.parcial === false && item.churn !== null;
    })
    .map(function (item) {
      return item.churn;
    });

  var clientesAtivos = clientesAtivosValidos.length;
  var percBons = percent_(statusCounts.bons, clientesAtivos);
  var percAlerta = percent_(statusCounts.alerta, clientesAtivos);
  var percCritico = percent_(statusCounts.critico, clientesAtivos);
  var atualizadoEm = Utilities.formatDate(hoje, Session.getScriptTimeZone(), "dd/MM/yyyy");
  var baseMesRecente = evolucaoMensal.length
    ? evolucaoMensal[evolucaoMensal.length - 1].base_inicio
    : 0;
  var variacaoBase =
    baseMesRecente > 0
      ? round_(((clientesAtivos - baseMesRecente) / baseMesRecente) * 100, 1)
      : 0;

  return {
    atualizado_em: atualizadoEm,
    clientes_ativos: clientesAtivos,
    clientes_bons: statusCounts.bons,
    clientes_alerta: statusCounts.alerta,
    clientes_critico: statusCounts.critico,
    perc_bons: percBons,
    perc_alerta: percAlerta,
    perc_critico: percCritico,
    ltv_medio: average_(ltvValoresAtivos),
    ltv_mediana: median_(ltvValoresAtivos),
    taxa_sucesso: percBons,
    churn_medio: average_(churnFechado),
    variacao_base: variacaoBase,
    por_gestor: buildPorGestor_(clientesAtivosValidos, hoje),
    evolucao_mensal: evolucaoMensal.map(function (item) {
      return {
        mes: item.label,
        base_inicio: item.base_inicio,
        entradas: item.entradas,
        saidas: item.saidas,
        churn: item.churn,
        parcial: item.parcial
      };
    }),
    saidas_por_mes: buildSaidasPorMes_(saidas, churnLookup, evolucaoMensal)
  };
}

function buildPorGestor_(rows, hoje) {
  var grouped = {};

  rows.forEach(function (row) {
    var gestor = normalizeDisplayText_(row["GESTOR"]) || "Sem gestor";
    var saude = normalizeSaude_(row["Saúde cliente"]);

    if (!grouped[gestor]) {
      grouped[gestor] = {
        nome: gestor,
        bons: 0,
        alerta: 0,
        critico: 0,
        ltvValores: []
      };
    }

    if (saude === "bom") grouped[gestor].bons += 1;
    if (saude === "alerta") grouped[gestor].alerta += 1;
    if (saude === "critico") grouped[gestor].critico += 1;

    var ltv = resolveLtvMeses_(row, hoje);
    if (ltv !== null) grouped[gestor].ltvValores.push(ltv);
  });

  return Object.keys(grouped)
    .map(function (nome) {
      var item = grouped[nome];
      var total = item.bons + item.alerta + item.critico;
      return {
        nome: item.nome,
        bons: item.bons,
        alerta: item.alerta,
        critico: item.critico,
        taxa_sucesso: percent_(item.bons, total),
        ltv_medio: average_(item.ltvValores)
      };
    })
    .sort(function (a, b) {
      return b.taxa_sucesso - a.taxa_sucesso;
    });
}

function buildEvolucaoMensal_(rows) {
  var parsed = rows
    .map(function (row) {
      var mesNumero = monthNumber_(row["mes"]);
      var ano = toNumber_(row["ano"]);
      var baseInicio = toNumber_(row["base_inicio"]);
      var entradas =
        row["entradas_mes"] === "" || row["entradas_mes"] === null
          ? null
          : toNumber_(row["entradas_mes"]);
      var saidas = toNumber_(row["saidas_mes"]);
      var parcial = parseBoolean_(row["parcial"]);

      return {
        ano: ano,
        mesNumero: mesNumero,
        mesNome: monthLabel_(mesNumero),
        base_inicio: baseInicio,
        entradas: entradas,
        saidas: saidas,
        parcial: parcial
      };
    })
    .filter(function (item) {
      return item.ano && item.mesNumero;
    })
    .sort(function (a, b) {
      return a.ano === b.ano ? a.mesNumero - b.mesNumero : a.ano - b.ano;
    });

  var includeYear = hasMultipleYears_(parsed);

  return parsed.map(function (item) {
    return {
      key: buildMonthKey_(item.ano, item.mesNumero),
      label: includeYear ? item.mesNome + "/" + item.ano : item.mesNome,
      base_inicio: item.base_inicio,
      entradas: item.entradas,
      saidas: item.saidas,
      churn: item.parcial || !item.base_inicio ? null : round_((item.saidas / item.base_inicio) * 100, 2),
      parcial: item.parcial
    };
  });
}

function buildSaidasPorMes_(rows, churnLookup, evolucaoMensal) {
  var includeYear = hasMultipleYears_(
    evolucaoMensal.map(function (item) {
      var parts = item.key.split("-");
      return { ano: Number(parts[0]) };
    })
  );

  var grouped = {};

  rows.forEach(function (row) {
    var nomeCliente = normalizeDisplayText_(row["nome_cliente"]);
    if (!nomeCliente) return;

    var dataSaida = parseDate_(row["data_saida"]);
    var mesNumero = dataSaida ? dataSaida.getMonth() + 1 : monthNumber_(row["mes_saida"]);
    var ano = dataSaida ? dataSaida.getFullYear() : toNumber_(row["ano_saida"]);

    if (!mesNumero || !ano) return;

    var key = buildMonthKey_(ano, mesNumero);
    if (!grouped[key]) {
      grouped[key] = {
        ano: ano,
        mesNumero: mesNumero,
        mesNome: monthLabel_(mesNumero),
        clientes: [],
        churn: churnLookup[key] ? churnLookup[key].churn : null,
        parcial: churnLookup[key] ? churnLookup[key].parcial : false
      };
    }

    grouped[key].clientes.push(nomeCliente);
  });

  return Object.keys(grouped)
    .map(function (key) {
      var item = grouped[key];
      return {
        sortKey: key,
        mes: includeYear ? item.mesNome + "/" + item.ano : item.mesNome,
        churn: item.churn,
        parcial: item.parcial,
        clientes: item.clientes
      };
    })
    .sort(function (a, b) {
      return a.sortKey.localeCompare(b.sortKey);
    })
    .map(function (item) {
      return {
        mes: item.mes,
        churn: item.churn,
        parcial: item.parcial,
        clientes: item.clientes
      };
    });
}

function resolveLtvMeses_(row, hoje) {
  var periodo = row["PERÍODO"];
  if (periodo !== "" && periodo !== null && periodo !== undefined) {
    var periodoNumero = Number(periodo);
    if (!isNaN(periodoNumero) && periodoNumero > 0) {
      return round_(periodoNumero, 1);
    }
  }

  var inicio = parseDate_(row["DATA PLANEJAMENTO"]);
  if (!inicio) return null;

  var fim = parseDate_(row["SAÍDA CLIENTE"]) || hoje;
  return diffInMonths_(inicio, fim);
}

function getSheetData_(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('A aba "' + sheetName + '" não foi encontrada.');
  }

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function (header) {
    return String(header).trim();
  });

  return values.slice(1).reduce(function (acc, row) {
    var empty = row.every(function (cell) {
      return cell === "" || cell === null;
    });
    if (empty) return acc;

    var item = {};
    headers.forEach(function (header, index) {
      item[header] = row[index];
    });
    acc.push(item);
    return acc;
  }, []);
}

function normalizeSaude_(value) {
  var normalized = normalizeText_(value);
  if (normalized === "bom") return "bom";
  if (normalized === "precisa de atencao") return "alerta";
  if (normalized === "situacao critica") return "critico";
  return "";
}

function normalizeText_(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeDisplayText_(value) {
  return String(value || "").trim();
}

function parseDate_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return value;
  }

  var text = String(value).trim();
  var br = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) {
    return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
  }

  var parsed = new Date(text);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function parseBoolean_(value) {
  var normalized = normalizeText_(value);
  return normalized === "true" || normalized === "sim" || normalized === "1" || normalized === "yes";
}

function diffInMonths_(startDate, endDate) {
  var years = endDate.getFullYear() - startDate.getFullYear();
  var months = endDate.getMonth() - startDate.getMonth();
  var total = years * 12 + months;
  var dayFactor = (endDate.getDate() - startDate.getDate()) / 30;
  return round_(Math.max(total + dayFactor, 0), 1);
}

function average_(values) {
  if (!values || !values.length) return 0;
  var sum = values.reduce(function (acc, value) {
    return acc + value;
  }, 0);
  return round_(sum / values.length, 1);
}

function median_(values) {
  if (!values || !values.length) return 0;
  var sorted = values.slice().sort(function (a, b) {
    return a - b;
  });
  var middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return round_((sorted[middle - 1] + sorted[middle]) / 2, 1);
  }
  return round_(sorted[middle], 1);
}

function percent_(value, total) {
  if (!total) return 0;
  return round_((value / total) * 100, 1);
}

function toNumber_(value) {
  var n = Number(value);
  return isNaN(n) ? 0 : n;
}

function round_(value, decimals) {
  var factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function monthNumber_(value) {
  if (typeof value === "number") return value;

  var normalized = normalizeText_(value);
  var months = {
    janeiro: 1,
    fevereiro: 2,
    marco: 3,
    abril: 4,
    maio: 5,
    junho: 6,
    julho: 7,
    agosto: 8,
    setembro: 9,
    outubro: 10,
    novembro: 11,
    dezembro: 12
  };

  if (months[normalized]) return months[normalized];

  var mmYY = normalized.match(/^(\d{2})\/(\d{2,4})$/);
  if (mmYY) return Number(mmYY[1]);

  return 0;
}

function monthLabel_(monthNumber) {
  var labels = [
    "",
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
  ];
  return labels[monthNumber] || "Mês";
}

function buildMonthKey_(year, monthNumber) {
  return String(year) + "-" + ("0" + monthNumber).slice(-2);
}

function hasMultipleYears_(rows) {
  var set = {};
  rows.forEach(function (row) {
    if (row.ano) set[row.ano] = true;
  });
  return Object.keys(set).length > 1;
}
