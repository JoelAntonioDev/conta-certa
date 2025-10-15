import React, { useState } from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import axios from "axios";
const steps = [
  "Escolha do Banco",
  "Upload de Ficheiros",
  "Mapeamento",
  "Resultado",
  "Gráfico e Relatório",
];

const ReconCiliacaoContabil = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [banco, setBanco] = useState("bfa");
  const [modelo, setModelo] = useState("coluna");

  const [extratoBancario, setExtratoBancario] = useState<File | null>(null);
  const [ficheiroContabilidade, setFicheiroContabilidade] =
    useState<File | null>(null);
  const [resultado, setResultado] = useState<any>(null);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);
  const handleImportar = async () => {
    if (!extratoBancario || !ficheiroContabilidade) return;

    const formData = new FormData();
    formData.append("banco", banco);
    formData.append("modelo", modelo);
    formData.append("extrato", extratoBancario);
    formData.append("contabilidade", ficheiroContabilidade);

    try {
      const response = await axios.post(
        "http://localhost:8001/contabil/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Resposta:", response.data);
      setResultado(response.data.dados);
      // Armazena os dados da API se quiseres usar no próximo passo
      handleNext();
    } catch (error) {
      console.error("Erro ao importar:", error);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6">
              Selecionar Banco e Modelo de Extrato
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Banco</InputLabel>
              <Select value={banco} onChange={(e) => setBanco(e.target.value)}>
                <MenuItem value="bfa">BFA</MenuItem>
                <MenuItem value="bai">BAI</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Modelo de Extrato</InputLabel>
              <Select
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
              >
                <MenuItem value="linha">Linha</MenuItem>
                <MenuItem value="coluna">Coluna</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              📤 Upload de Ficheiros
            </Typography>

            <Box
              display="flex"
              flexWrap="wrap"
              gap={2}
              mt={2}
              sx={{ justifyContent: "space-between" }}
            >
              {/* Caixa do Extrato Bancário */}
              <Box
                sx={{
                  flex: "1 1 45%",
                  border: "2px dashed #1976d2",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: "#f9f9f9",
                }}
                onClick={() =>
                  document.getElementById("input-extrato")?.click()
                }
              >
                <Typography fontWeight="bold">📄 Extrato Bancário</Typography>
                <Typography variant="body2" color="text.secondary">
                  Arraste ou clique para selecionar
                </Typography>
                <input
                  type="file"
                  id="input-extrato"
                  hidden
                  accept=".csv, .xlsx, pdf"
                  onChange={(e) =>
                    setExtratoBancario(e.target.files?.[0] || null)
                  }
                />
                {extratoBancario && (
                  <Typography mt={1} fontSize="0.85rem" color="green">
                    ✅ {extratoBancario.name}
                  </Typography>
                )}
              </Box>

              {/* Caixa do Ficheiro Contábil */}
              <Box
                sx={{
                  flex: "1 1 45%",
                  border: "2px dashed #1976d2",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: "#f9f9f9",
                }}
                onClick={() =>
                  document.getElementById("input-contabilidade")?.click()
                }
              >
                <Typography fontWeight="bold">📘 Ficheiro Contábil</Typography>
                <Typography variant="body2" color="text.secondary">
                  Arraste ou clique para selecionar
                </Typography>
                <input
                  type="file"
                  id="input-contabilidade"
                  hidden
                  accept=".csv, .xlsx"
                  onChange={(e) =>
                    setFicheiroContabilidade(e.target.files?.[0] || null)
                  }
                />
                {ficheiroContabilidade && (
                  <Typography mt={1} fontSize="0.85rem" color="green">
                    ✅ {ficheiroContabilidade.name}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Botão importar */}
            <Box mt={3}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleImportar} // ← CORRIGIDO
                disabled={!extratoBancario || !ficheiroContabilidade}
              >
                Importar Ficheiros
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography>
              🔧 Mapeamento de colunas (ex: data, crédito, débito...)
            </Typography>
            {/* Em breve: leitura automática das colunas dos ficheiros */}
          </Box>
        );

      case 3:
        if (!resultado) return <Typography>Carregando resultado...</Typography>;

        const conciliacao = resultado.conciliacao;

        if (!conciliacao)
          return <Typography>Conciliação não encontrada.</Typography>;

        return (
          <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
            <Typography
              variant="h5"
              fontWeight="bold"
              gutterBottom
              color="primary"
            >
              ✅ Resultado da Reconciliação
            </Typography>

            {/* Resumo geral em cards */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                justifyContent: "space-between",
                mb: 4,
              }}
            >
              {[
                {
                  label: "Total Extrato",
                  value: resultado.summary?.total_extrato ?? 0,
                },
                {
                  label: "Total Contabilidade",
                  value: resultado.summary?.total_contabilidade ?? 0,
                },
                {
                  label: "Conciliados",
                  value: resultado.summary?.conciliados ?? 0,
                },
                {
                  label: "Somente no Extrato",
                  value: resultado.summary?.somente_extrato ?? 0,
                },
                {
                  label: "Somente na Contabilidade",
                  value: resultado.summary?.somente_contabilidade ?? 0,
                },
              ].map(({ label, value }) => (
                <Box
                  key={label}
                  sx={{
                    flex: "1 1 170px",
                    bgcolor: "#f0f4ff",
                    borderRadius: 2,
                    p: 2,
                    boxShadow: 1,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    mb={0.5}
                  >
                    {label}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Listas detalhadas em cards scrolláveis */}

            <Box
              sx={{
                display: "flex",
                gap: 3,
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              {/* Conciliados */}
              <Box
                sx={{
                  flex: "1 1 45%",
                  maxHeight: 320,
                  overflowY: "auto",
                  bgcolor: "#e8f0fe",
                  borderRadius: 2,
                  p: 2,
                  boxShadow: 1,
                }}
              >
                <Typography variant="h6" mb={2} color="primary">
                  Conciliados ({conciliacao.conciliados.length})
                </Typography>
                {conciliacao.conciliados.length === 0 && (
                  <Typography>Nenhum conciliado.</Typography>
                )}
                {conciliacao.conciliados.map((item: any, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 1.5,
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Typography noWrap>
                      <b>Extrato:</b> {item.extrato_descritivo} (
                      {item.extrato_valor_liq?.toFixed(2) ?? "0.00"})
                    </Typography>
                    <Typography noWrap>
                      <b>Contabilidade:</b> {item.contab_descritivo} (
                      {item.contab_valor_liq?.toFixed(2) ?? "0.00"})
                    </Typography>
                    <Typography color="text.secondary" fontSize="0.85rem">
                      <b>Status:</b> {item.status}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Somente Extrato */}
              <Box
                sx={{
                  flex: "1 1 45%",
                  maxHeight: 320,
                  overflowY: "auto",
                  bgcolor: "#fff7f0",
                  borderRadius: 2,
                  p: 2,
                  boxShadow: 1,
                }}
              >
                <Typography variant="h6" mb={2} color="primary">
                  Movimentos apenas no Extrato (
                  {conciliacao.somente_extrato.length})
                </Typography>
                {conciliacao.somente_extrato.length === 0 && (
                  <Typography>Nenhum.</Typography>
                )}
                {conciliacao.somente_extrato.map((item: any, index: number) => (
                  <Typography
                    key={index}
                    variant="body2"
                    sx={{
                      mb: 1,
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    }}
                  >
                    [{item.data_mov}] {item.descritivo} -{" "}
                    {(item.credito - item.debito).toFixed(2)}
                  </Typography>
                ))}
              </Box>

              {/* Somente Contabilidade */}
              <Box
                sx={{
                  flex: "1 1 45%",
                  maxHeight: 320,
                  overflowY: "auto",
                  bgcolor: "#f0fff7",
                  borderRadius: 2,
                  p: 2,
                  boxShadow: 1,
                  mt: 3,
                }}
              >
                <Typography variant="h6" mb={2} color="primary">
                  Movimentos apenas na Contabilidade (
                  {conciliacao.somente_contabilidade.length})
                </Typography>
                {conciliacao.somente_contabilidade.length === 0 && (
                  <Typography>Nenhum.</Typography>
                )}
                {conciliacao.somente_contabilidade.map(
                  (item: any, index: number) => (
                    <Typography
                      key={index}
                      variant="body2"
                      sx={{
                        mb: 1,
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      [{item.data_mov}] {item.descritivo} -{" "}
                      {(item.credito - item.debito).toFixed(2)}
                    </Typography>
                  )
                )}
              </Box>
            </Box>
          </Box>
        );

      case 4:
        if (!resultado)
          return <Typography>Carregando dados para gráfico...</Typography>;

        const resumo = resultado.conciliacao?.summary;
        if (!resumo) return <Typography>Resumo não encontrado.</Typography>;

        // Dados para o gráfico
        const dataGrafico = [
          { name: "Conciliados", value: resumo.conciliados ?? 0 },
          { name: "Somente Extrato", value: resumo.somente_extrato ?? 0 },
          {
            name: "Somente Contabilidade",
            value: resumo.somente_contabilidade ?? 0,
          },
        ];

        // Função para exportar CSV
        const exportarCSV = () => {
          const rows = [
            ["Categoria", "Quantidade"],
            ...dataGrafico.map(({ name, value }) => [name, value]),
          ];
          const csvContent =
            "data:text/csv;charset=utf-8," +
            rows.map((e) => e.join(",")).join("\n");

          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "resumo_reconciliacao.csv");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        return (
          <Box sx={{ maxWidth: 700, mx: "auto", p: 3 }}>
            <Typography
              variant="h5"
              gutterBottom
              color="primary"
              fontWeight="bold"
            >
              📊 Gráfico de Resumo da Reconciliação
            </Typography>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={dataGrafico}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>

            <Box mt={3} display="flex" justifyContent="center">
              <Button variant="contained" color="primary" onClick={exportarCSV}>
                📥 Exportar Relatório CSV
              </Button>
            </Box>
          </Box>
        );
        break;
      default:
        return "Passo desconhecido";
    }
  };

  return (
    <Box sx={{ width: "100%", padding: "2rem" }}>
      <Typography variant="h5" gutterBottom>
        🔄 Reconciliação Contábil
      </Typography>

      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{ marginBottom: "2rem" }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box>{renderStepContent(activeStep)}</Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "2rem",
        }}
      >
        <Button disabled={activeStep === 0} onClick={handleBack}>
          Voltar
        </Button>

        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
          >
            Finalizar
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              activeStep === 1 && (!extratoBancario || !ficheiroContabilidade)
            }
          >
            Próximo
          </Button>
        )}

      </Box>
    </Box>
  );
};

export default ReconCiliacaoContabil;
