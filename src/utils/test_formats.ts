import axios from 'axios';

const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZXF1ZXN0SWQiOiIzNjY1NmQ2NTQxNGMzNTMyMzkzOTMzMzkiLCJjb21wYW55SWQiOjUxNDY0NH0.eTGLvhUR51o2twJnvSJYvSzcAtFJE8M0hH1TIC2NnO4";
const key = "514644TeCQrLJfVk69ff7ba5P1";

async function test() {
    const formats = [
        { authkey: key, 'access-token': token },
        { authKey: key, 'access-token': token },
        { authkey: key, accessToken: token },
        { authKey: key, accessToken: token },
        { authkey: key, token: token },
    ];

    for (const body of formats) {
        console.log(`\nTesting format: ${JSON.stringify(Object.keys(body))}`);
        try {
            const url = `https://control.msg91.com/api/v5/widget/verifyAccessToken?authkey=${key}&access-token=${token}`;
            const response = await axios.post(url);
            console.log('Result (Query params):', JSON.stringify(response.data));
        } catch (err: any) {
            console.log('Error (Query params):', err.response?.data || err.message);
        }
    }
}

test();
