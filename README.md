
## Documentação do Serviço

#### Variáveis de ambiente

```
URL_API_SQL=http://minhaapi-sql.com
API_SQL_KEY=uuid-secret
LOT_SIZE=10000 [qtde_imoveis_por_lote]
CHECK_INTERVAL=10000 [tempo_em_ms_para_checagem_na_api]
SCHEDULED_TIME=HH:MM:SS (hora do inicio diario do serviço)
RDS_MYSQL_HOST=[host.com.br]
RDS_MYSQL_PORT=[3306]
RDS_MYSQL_USER=[user]
RDS_MYSQL_PASSWORD=[password]
```

#### Instalação em produção

```
npm install --omit=dev
```

#### Agendar o processo para o SCHEDULED_TIME

```
npm start
```

#### Iniciar o processo imediatamente

```
npm start now
```

#### Rodar testes unitários

```
npm install
npm test
```