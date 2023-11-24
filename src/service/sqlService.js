const { setTimeout } = require('timers/promises')
const csvtojson = require('csvtojson');

class SqlService {
    #httpService
    constructor({ httpService }) {
        this.#httpService = httpService;
    }

    async sendCsv({ fileDataString }) {
        const response = await this.#httpService.makeRequest({
            method: 'POST',
            maxBodyLength: Infinity,
            fileDataString: fileDataString,
            url: `${process.env.URL_API_SQL}/process`,
            headers: { 
                'api_key': process.env.API_SQL_KEY
            }
        });

        return response.id;
    }

    async getResult(processId, intervalBetweenChecks, attempts = 0) {
        return new Promise(async resolve => {
            const responses = this.checkResultFromApi(processId, intervalBetweenChecks);
            
            for await (const response of responses) {
                attempts++;
                if (response.status !== 'STARTED' && response.status !== 'RECEIVED') {
                    const sqls = await csvtojson().fromString(response)
                    resolve(sqls)
                    process.stdout.write(`\n`);
                    break;
                } else {
                    process.stdout.write(`\rTentativas... ${attempts}`);
                }
            }
        })
    }

    async* checkResultFromApi(processId, intervalBetweenChecks) {
        let query;

        do {
            const requestOptions = {
                method: 'GET',
                url: `${process.env.URL_API_SQL}/result/${processId}`,
                headers: { 
                    'api_key': process.env.API_SQL_KEY
                }
            };
            
            query = await this.#httpService.makeRequest(requestOptions);

            if (query.status === 'STARTED' || query.status === 'RECEIVED') {
                await setTimeout(intervalBetweenChecks || process.env.CHECK_INTERVAL);
            }
        
            yield query;

        } while(query.status === 'STARTED' || query.status === 'RECEIVED');
    }
}

module.exports = SqlService;