const BaseRepository = require('./base/baseRepository')

class PropertyRepository extends BaseRepository {
    constructor() {
        super();

        this.credentials = {
            host: process.env.RDS_MYSQL_HOST, 
            port: process.env.RDS_MYSQL_PORT, 
            user: process.env.RDS_MYSQL_USER, 
            password: process.env.RDS_MYSQL_PASSWORD, 
            database: 'integracao_consolidado'
        }
    }

    async getData() {
        const sql = `select 
            id_empresa,
            codigo,
            endereco_tipo,
            logradouro,
            numero,
            complemento,
            cidade,
            cep,
            uf,
            categoria,
            JSON_UNQUOTE(JSON_EXTRACT(proprietarios, '$[0].nome')) AS nome_proprietario,
            area_util
        from integracao_consolidado.imoveis
        where ativo = 1 and
            \`sql\` is null 
        limit ${process.env.LOT_SIZE || 10000}`;
        
        const results = await this.query(sql);

        return results
    }

    async saveData(properties) {
        const sql = `INSERT INTO integracao_consolidado.imoveis (
            id_empresa,
            codigo,
            \`sql\`
        ) VALUES ${properties.map(property => {
            return `(
                '${property['id_empresa']}',
                '${property['codigo']}',
                '${property['sql']}'
            )`}).join(',')
        }
        ON DUPLICATE KEY UPDATE 
            \`sql\` = VALUES(\`sql\`)
        `;

        await this.query(sql);
    }
}

module.exports = PropertyRepository;