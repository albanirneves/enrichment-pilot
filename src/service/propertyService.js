const PropertyRepository = require('../repository/propertyRepository');
const Property = require('../entities/property');

class PropertyService {
    constructor () {
        this.propertyRepository = new PropertyRepository();
    }

    async getPropertiesWithoutSql() {
        const dataProperties = await this.propertyRepository.getData();

        const propertiesWithoutSql = dataProperties.map(dataProperty => {
            return new Property(dataProperty);
        });

        return propertiesWithoutSql;
    }

    async getDataCsv(properties) {
        const results = properties || await this.getPropertiesWithoutSql();

        function removeCommas(str) { 
            return String(str || '').replace(/,/ig, '')
        }

        let dataCsv = `UF,Cidade,Endereco,Numero,Finalidade,Nome,AreaUtil,Complemento,Cep\n`;

        results.map(property => {
            const infoList = [
                property.uf,
                property.cidade,
                `${property.endereco_tipo} ${property.logradouro}`,
                property.numero,
                property.categoria,
                property.nome_proprietario,
                property.area_util,
                property.complemento,
                property.cep
            ]

            dataCsv += infoList.map(removeCommas).join(',') + '\n';
        });

        return dataCsv;
    }

    async enrich(propertiesWithoutSql, sqls) {
        const qtyProperties = propertiesWithoutSql.length;

        const propertiesWithSql = [];

        for (let i = 0; i < qtyProperties; i++) {
            propertiesWithSql.push({
                ...propertiesWithoutSql[i],
                sql: sqls[i].id_unidade || '0'
            })
        }

        return propertiesWithSql;
    }
}

module.exports = PropertyService;