import axios from 'axios';

const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZXF1ZXN0SWQiOiIzNjY1NmQ2NTQxNGMzNTMyMzkzOTMzMzkiLCJjb21wYW55SWQiOjUxNDY0NH0.eTGLvhUR51o2twJnvSJYvSzcAtFJE8M0hH1TIC2NnO4";
const key = "514644AgsSOf1wcDT6a03794eP1";

async function test() {
    try {
        console.log('\nTesting v5/otp/verify with requestId');
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        const requestId = payload.requestId;
        
        const response = await axios.get(`https://api.msg91.com/api/v5/otp/verify?authkey=${key}&mobile=918310333939&otp=123456&request_id=${requestId}`);
        console.log('Result:', JSON.stringify(response.data));
    } catch (err: any) {
        console.log('Error:', err.response?.data || err.message);
    }
}

test();
