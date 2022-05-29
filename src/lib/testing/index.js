const axios = require('axios');
const axioReq = async () => {
    const config = {
        params: {
            user_id: "userid",
            func: "setupUserAccount",
            params: { dob: '02-2020-2019', street: '1209 glen', street2: "", city: 'berkeley', state: "ca", zip: 94708, userId: 'bspr' }
        },
        method: "POST",
        headers: {
            'earmark-api-key': '30icv-rf5Ta-uEyg3-WwY85'
        }
    };
    const response = await axios.post("http://192.168.4.29:8080/api/firebase/firestore", null, config);
    console.log(response.data)
}

axioReq();