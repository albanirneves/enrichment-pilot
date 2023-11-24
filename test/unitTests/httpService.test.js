'use strict';

const { describe, it, beforeEach, afterEach } = require('mocha');
const { join } = require('path');
const { expect } = require('chai');
const { readFile } = require('fs/promises');
const FormData = require('form-data');

const { createSandbox } = require('sinon');
let axios = require('axios');

const HttpService = require('../../src/service/httpService');

require('dotenv').config();

const mocks = {
    pathValidFileRequestCsv: join(__dirname, '..', 'mocks', 'valid-file-request.csv'),
    validGetResponse: require('../mocks/valid-get-response.json'),
    validPostResponse: require('../mocks/valid-post-response.json')
}

describe('HttpService Suite Tests', function () {
    let httpService = {};
    let sinon = {};

    beforeEach(() => {
        httpService = new HttpService();
        sinon = createSandbox();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('fazer uma request GET / e obter a resposta', async () => {
        const requestOptions = {
            method: 'GET',
            url: process.env.URL_API_SQL,
            headers: { 
                'api_key': process.env.API_SQL_KEY
            }
        };

        sinon
            .stub(axios, 'default')
            .resolves(Promise.resolve({ status: 200, data: mocks.validGetResponse }));

        const actual = await httpService.makeRequest(requestOptions);
        
        const expected = {
            "active": true,
            "msg": "I'm working"
        }
        
        expect(actual).to.be.deep.equal(expected);
    })

    it('criar um FormData para ser enviado como multipart/form-data', async function() {
        const fileDataString = (await readFile(mocks.pathValidFileRequestCsv)).toString();
        const formData = await httpService.createMultipartFormData({ fileDataString });
        const actual = formData instanceof FormData;
        
        expect(actual).to.be.true;
    });

    it('fazer uma request POST /process com um arquivo com content-type multipart/form-data', async function() {
        const fileDataString = (await readFile(mocks.pathValidFileRequestCsv)).toString();
        
        const requestOptions = {
            method: 'POST',
            maxBodyLength: Infinity,
            fileDataString: fileDataString,
            url: `${process.env.URL_API_SQL}/process`,
            headers: { 
                'api_key': process.env.API_SQL_KEY
            }
        };

        sinon
            .stub(axios, 'default')
            .resolves(Promise.resolve({ status: 200, data: mocks.validPostResponse }));

        const actual = await httpService.makeRequest(requestOptions);

        const expected = { ...mocks.validPostResponse };

        expect(actual).to.be.deep.equal(expected);
    });
})