const axios = require('axios'); // Make sure to import Axios if you haven't already

const baseUrl = 'https://api.dock.io/'; // Replace with your actual base URL

const axiosHeaders = {
    headers: {
        'DOCK-API-TOKEN': process.env.DOCK_API_TOKEN,
    },
};

const polygonDidBody = {
    keyType: 'bjj',
    type: 'polygonid',
};

async function makeApiCall() {
    try {
        const didResp = await axios.post(`${baseUrl}/dids`, polygonDidBody, axiosHeaders);

        // Assuming the API response contains data, you can access it using didResp.data
        console.log('API Response:', didResp.data);

        // Now you can handle the response as needed, for example:
        // Do something with the response data

    } catch (error) {
        // If there's an error in the API call, handle it here
        console.error('Error making API call:', error.message);
    }
}

// Call the async function
makeApiCall();

