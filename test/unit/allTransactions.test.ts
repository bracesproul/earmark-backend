const fs = require('fs');
const axios = require('axios');

const fetchTransactions = () => {
  let response;
  fs.readFile('C:/cygwin/home/sales/earmark/new-earmark/backend/test/test_data/transactions_output.txt', 'utf8', (err, dataRes) => {
    if (err) {
      console.error(err);
    } else {
      response = dataRes;
    }
  });
  return response;
}

const fetchData = async () => {
  const config = {
    headers: {
      'earmark-api-key': '30icv-rf5Ta-uEyg3-WwY85'
    },
    params: {
      user_id: 'A9kohZbP3WRB1qdr3CqEd9GOLi33',
      startDate: '2020-01-01',
      endDate: '2022-01-01',
      queryType: 'datagrid'
    },
    url: 'http://localhost:8080/api/earmark/allTransactions',
    method: 'GET'
  };
  const { data } = await axios(config);
  return data;
}


describe('allTransactions', () => {
  describe('when api call is successful', () => {
    it ('should return string that matches transactions_output.txt string', async () => {

      const expectedRes = fetchTransactions();
      const apiRes = await fetchData()

      expect(JSON.stringify(apiRes)).toBe(expectedRes);
    })
  })
})