'use strict';

require('dotenv').config();

const HttpService = require('./service/httpService');
const PropertyService = require('./service/propertyService');
const SqlService = require('./service/sqlService');

const httpService = new HttpService();
const propertyService = new PropertyService();
const sqlService = new SqlService({ httpService });

const schedule = require('node-schedule');
const { setTimeout } = require('timers/promises');

let enriching = false;

const { join } = require('path');
const { mkdirSync, writeFileSync } = require('fs');

mkdirSync('./tmp');

async function enrich() {
    enriching = true;

    let propertiesWithoutSql = await propertyService.getPropertiesWithoutSql();

    while(propertiesWithoutSql.length > 0) {
        try {
            console.log('Obtendo imóveis para enriquecer');
            propertiesWithoutSql = await propertyService.getPropertiesWithoutSql();
            console.log(`${propertiesWithoutSql.length} imóveis obtidos`);
            
            console.log('Enviando imóveis para API de SQLs...');
            const propertiesCsv = await propertyService.getDataCsv(propertiesWithoutSql);
            
            writeFileSync(join('.tmp', 'temp.csv'), propertiesCsv)
            
            const processId = await sqlService.sendCsv({ fileDataString: propertiesCsv });
            
            console.log(`Imóveis enviados, aguardando api... ProcessID: ${processId}`);
            const sqls = await sqlService.getResult(processId);
    
            console.log('Resultados obtidos. Enriquecendo...');
            const propertiesWithSql = await propertyService.enrich(propertiesWithoutSql, sqls);
            const propertiesEnriched = propertiesWithSql.filter(p => !!p.sql && p.sql !== '0');
            console.log(`${propertiesEnriched.length} de ${propertiesWithoutSql.length} SQLs encontrados`)
            
            console.log('Salvando dados...')
            await propertyService.propertyRepository.saveData(propertiesWithSql);
            
        } catch (error) {
            //se der erro espera 10s e tenta novamente
            console.log(error)
            console.log('Erro inesperado, tentando novamente...');
            await setTimeout(10000);
        }
    }

    console.log('Todos os imóveis foram enriquecidos');
    enriching = false;
};

if(process.argv[2] == 'now') {
    enrich();
} else {
    const scheduledTime = process.env.SCHEDULED_TIME;
    const timesplit = (scheduledTime || '').split(':');
    const hours   = timesplit[0] || '00';
    const minutes = timesplit[1] || '00';
    const seconds = timesplit[2] || '00';

    console.log(`Processo agendado para ${process.env.SCHEDULED_TIME}`);
    
    schedule.scheduleJob(`${seconds} ${minutes} ${hours} * * *`, function() {
        if(enriching !== true) {
            enrich();
        }
    });
}

function gracefulShutdown(event) {
    return async code => {
        console.info(`${event} signal received with code ${code}`);
        process.exit(code || 0);
    }
}

process.on('SIGINT', gracefulShutdown('SIGINT'));
process.on('SIGTERM', gracefulShutdown('SIGTERM'));
process.on('exit', code => {
    console.log('exit signal received', code);
});
process.on('uncaughtException', (error, origin) => {
    console.log(`${origin} signal received. \n ${error}`);
});
process.on('unhandledRejection', error => {
    console.log(`unhandledRejection signal received. \n ${error}`);
});