import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
} from "@mui/material";

const Dashboard = () => {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:8001/dashboard")
      .then((res) => setDados(res.data))
      .catch((err) => console.error("Erro ao carregar dashboard", err));
  }, []);

  if (!dados)
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        📊 Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Empresa */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                🏢 Empresa
              </Typography>
              <Typography>
                <strong>Nome:</strong> {dados.empresa.nome}
              </Typography>
              <Typography>
                <strong>NIF:</strong> {dados.empresa.nif}
              </Typography>
              <Typography>
                <strong>Licença válida até:</strong>{" "}
                {dados.empresa.validade_licenca}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Execuções */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="secondary">
                ⚙️ Execuções
              </Typography>
              <Typography>
                <strong>Total:</strong> {dados.execucoes.total}
              </Typography>
              <Typography>
                <strong>Última execução:</strong>{" "}
                {dados.execucoes.ultima_execucao || "Nenhuma"}
              </Typography>
              <Typography>
                <strong>Status:</strong> {dados.execucoes.status || "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Movimentações */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                💰 Movimentações
              </Typography>
              <Typography>
                <strong>Total extrato:</strong>{" "}
                {dados.movimentacoes.total_extrato}
              </Typography>
              <Typography>
                <strong>Total contabilidade:</strong>{" "}
                {dados.movimentacoes.total_contabilidade}
              </Typography>
              <Typography>
                <strong>Não conciliados:</strong>{" "}
                {dados.movimentacoes.nao_conciliados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
