'use strict';

const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const { createSandbox } = require('sinon');
const { readFile } = require('fs/promises')
const { join } = require('path');
const axios = require('axios');

const PropertyService = require('../../src/service/propertyService');
const SqlService = require('../../src/service/sqlService');
const HttpService = require('../../src/service/httpService');
const httpService = new HttpService();

require('dotenv').config();

const mocks = {
    pathValidFileRequestCsv: join(__dirname, '..', 'mocks', 'valid-file-request.csv'),
    pathValidFileResponseCsv: join(__dirname, '..', 'mocks', 'valid-file-response.csv'),
    validDataSqls: require('../mocks/valid-data-sqls.json'),
    validPostResponse: require('../mocks/valid-post-response.json'),
    validPropertiesWithoutSql: require('../mocks/valid-properties-without-sql.json'),
    validPropertiesWithSql: require('../mocks/valid-properties-with-sql.json')
};

describe('PropertyService Suite Tests', function () {
    let propertyService = {};
    let sqlService = {};
    let sinon = {};

    //para fazer o teste real indo ao banco tem que aumentar o timeout
    this.timeout(180000);

    beforeEach(() => {
        propertyService = new PropertyService();
        sqlService = new SqlService({ httpService });
        sinon = createSandbox();
    });

    afterEach(() => {
        sinon.restore();;
    });

    it('obter lista de imoveis sem SQL do banco integracao_consolidado.imoveis', async () => {
        sinon.stub(
            propertyService.propertyRepository, 
            propertyService.propertyRepository.query.name
        )
        .resolves(Promise.resolve([ ...mocks.validPropertiesWithoutSql ]));

        const results = await propertyService.getPropertiesWithoutSql();
        const expected = [ ...mocks.validPropertiesWithoutSql ];

        expect(results).to.be.deep.equal(expected);
    });

    it('montar um csv com os imoveis retornados', async () => {
        sinon.stub(
            propertyService.propertyRepository, 
            propertyService.propertyRepository.query.name
        )
        .resolves(Promise.resolve([ ...mocks.validPropertiesWithoutSql ]));

        const actual = await propertyService.getDataCsv()
        const expected = (await readFile(mocks.pathValidFileRequestCsv)).toString().replace(/\r\n/ig, '\n');

        expect(actual).to.be.equal(expected);
    });

    it('enriquecer os imóveis com os SQLs retornados', async () => {
        sinon
            .stub(
                propertyService.propertyRepository, 
                propertyService.propertyRepository.query.name
            )
            .resolves(Promise.resolve([ ...mocks.validPropertiesWithoutSql ]));

        const propertiesWithoutSql = await propertyService.getPropertiesWithoutSql();
        const propertiesCsv = await propertyService.getDataCsv(propertiesWithoutSql);

        sinon
            .stub(axios, 'default')
            .resolves(Promise.resolve({ status: 200, data: mocks.validPostResponse }));

        const processId = await sqlService.sendCsv({ fileDataString: propertiesCsv });
        
        sinon.restore();

        const fakeApiResponse = (await readFile(mocks.pathValidFileResponseCsv)).toString();

        sinon
            .stub(axios, 'default')
            .resolves(Promise.resolve({ data: fakeApiResponse }));
        
        const intervalBetweenChecks = 1000;
        const sqls = await sqlService.getResult(processId, intervalBetweenChecks)
        const actual = await propertyService.enrich(propertiesWithoutSql, sqls);

        expect(actual).to.be.deep.equal([ ...mocks.validPropertiesWithSql ])
    });

    it('salvar os imóveis enriquecidos', async () => {
        const properties = [ ...mocks.validPropertiesWithSql ];

        sinon.stub(
            propertyService.propertyRepository, 
            propertyService.propertyRepository.query.name
        )
        .resolves(Promise.resolve());

        await propertyService.propertyRepository.saveData(properties);
    });
})