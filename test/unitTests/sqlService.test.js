'use strict';

const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const { createSandbox } = require('sinon');
const axios = require('axios');
const { join } = require('path');
const { readFile } = require('fs/promises');

const SqlService = require('../../src/service/sqlService');
const HttpService = require('../../src/service/httpService');
const httpService = new HttpService();

require('dotenv').config();

const mocks = {
    pathValidFileRequestCsv: join(__dirname, '..', 'mocks', 'valid-file-request.csv'),
    pathValidFileResponseCsv: join(__dirname, '..', 'mocks', 'valid-file-response.csv'),
    validDataSqls: require('../mocks/valid-data-sqls.json'),
    validPostResponse: require('../mocks/valid-post-response.json')
};

describe('SqlService Suite Tests', function () {
    let sqlService = {};
    let sinon = {};

    //para fazer o teste real indo ao banco tem que aumentar o timeout
    this.timeout(180000);

    beforeEach(() => {
        sqlService = new SqlService({ httpService });
        sinon = createSandbox();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('enviar o arquivo csv com os endereços e guardar o id retornado', async () => {
        sinon
            .stub(axios, 'default')
            .resolves(Promise.resolve({ status: 200, data: mocks.validPostResponse }));
        
        const fileDataString = (await readFile(mocks.pathValidFileRequestCsv)).toString();
        const response = await sqlService.sendCsv({ fileDataString });
        const expected = mocks.validPostResponse.id;
        
        expect(response).to.be.deep.equal(expected);
    })

    it('checar se o processo de enriquecimento foi finalizado na api', async () => {
        const { id: processId } = mocks.validPostResponse;
        const intervalBetweenChecks = 1;
        const responses = sqlService.checkResultFromApi(processId, intervalBetweenChecks);
        
        const expected = { status: 'STARTED' }
        
        sinon
            .stub(axios, 'default')
            .resolves(Promise.resolve({ data: { status: 'STARTED'} }));

        const { value: actual } = await responses.next();

        expect(actual).to.be.deep.equal(expected);
    });

    it('ficar checando até o processo de enriquecimento ser finalizado na api', async () => {
        const { id: processId } = mocks.validPostResponse;
        const intervalBetweenChecks = 1;
        const responses = sqlService.checkResultFromApi(processId, intervalBetweenChecks);
        
        const expected = (await readFile(mocks.pathValidFileResponseCsv)).toString();
        let actual;

        //simula checagem que retorna status para checar novamente
        sinon
            .stub(axios, 'default')
            .resolves(Promise.resolve({ data: { status: 'RECEIVED'} }));

        const spy = sinon.spy(
            httpService,
            httpService.makeRequest.name
        );

        //simula 10 checagens, na décima retorna o resultado esperado
        const MAX_CHECKS = 10;
        let checks = 0;

        for await (const response of responses) {
            checks++;
            
            if(checks === MAX_CHECKS) {
                //na décima checagem retorna o resultado esperado
                sinon.restore();
                sinon
                    .stub(axios, 'default')
                    .resolves(Promise.resolve({ data: expected }));
            }

            if (response.status !== 'STARTED' && response.status !== 'RECEIVED') {
                actual = response
                break;
            }
        }

        expect(spy.callCount).to.be.deep.equal(MAX_CHECKS);
        expect(actual).to.be.deep.equal(expected);
    });

    it('obter o resultado do enriquecimento', async () => {
        const { id: processId } = mocks.validPostResponse;

        const fakeApiResponse = (await readFile(mocks.pathValidFileResponseCsv)).toString();
        const expected = [ ...mocks.validDataSqls ]

        sinon
            .stub(axios, 'default')
            .resolves(Promise.resolve({ data: fakeApiResponse }));

        const intervalBetweenChecks = 1;
        const actual = await sqlService.getResult(processId, intervalBetweenChecks)

        expect(actual).to.be.deep.equal(expected);
    })
})