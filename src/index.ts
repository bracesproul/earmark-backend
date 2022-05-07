
const axios = require('axios');

const getAccessToken = async () => {

  const create_link_token_url = 'http://localhost:5000/link/token/create'
  const userId = "test_user_id_123_123_123_123_123_123_123_123_123_123_123_123_123_123_123_123_123_123_123_123"
    const config = {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        user_id: userId
      }
    };
    const body = {
      user_id: userId,
    }
    try {
      const res = await axios.post(create_link_token_url, body, config)
      console.log(res);
    } catch (error) {
      console.log(error)
    }
}

getAccessToken();