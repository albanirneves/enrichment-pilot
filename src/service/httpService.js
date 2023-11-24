const axios = require('axios');
const FormData = require('form-data');

class HttpService {
    async makeRequest(requestOptions) {
        if(requestOptions.fileDataString){
            requestOptions.data = this.createMultipartFormData(requestOptions);

            requestOptions.headers = {
                ...requestOptions.headers,
                ...requestOptions.data.getHeaders()
            }
        }

        const query = await axios.default(requestOptions);

        return query.data;
    }

    createMultipartFormData({ fileDataString }) {
        const formData = new FormData();

        formData.append('file', Buffer.from(fileDataString), {
            filename: 'file.csv',
            contentType: 'text/plain',
        });

        return formData;
    }
}

module.exports = HttpService;