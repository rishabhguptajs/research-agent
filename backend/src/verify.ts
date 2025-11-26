import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

async function testBackend() {
    const API_URL = 'http://localhost:3000';

    try {
        console.log('1. Creating Job...');
        const createRes = await axios.post(`${API_URL}/job`, {
            query: 'What are the latest advancements in solid state batteries?'
        });

        const jobId = createRes.data.jobId;
        console.log(`Job Created: ${jobId}`);

        console.log('2. Polling Job Status...');
        let status = 'planning';
        while (status !== 'done' && status !== 'error') {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const jobRes = await axios.get(`${API_URL}/job/${jobId}`);
            status = jobRes.data.status;
            console.log(`Status: ${status}`);
            if (status === 'error') {
                console.error('Job failed:', jobRes.data);
            }
        }

        if (status === 'done') {
            const finalRes = await axios.get(`${API_URL}/job/${jobId}`);
            console.log('Job Completed Successfully!');
            console.log('Summary:', finalRes.data.data.final?.summary);

            const testDir = path.join(__dirname, '..', 'test');
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const filename = path.join(testDir, `research-result-${timestamp}.json`);

            fs.writeFileSync(filename, JSON.stringify(finalRes.data, null, 2));
            console.log(`\n✅ Result saved to: ${filename}`);
        }

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

testBackend();
