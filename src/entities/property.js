class Property {
    constructor(data){
        this.id_empresa = data.id_empresa;
        this.codigo = data.codigo;
        this.sql = data.sql;
        this.endereco_tipo = data.endereco_tipo;
        this.logradouro = data.logradouro;
        this.numero = data.numero;
        this.complemento = data.complemento;
        this.cidade = data.cidade;
        this.cep = data.cep;
        this.uf = data.uf;
        this.categoria = data.categoria;
        this.nome_proprietario = data.nome_proprietario;
        this.area_util = data.area_util;
    }
}

module.exports = Property;