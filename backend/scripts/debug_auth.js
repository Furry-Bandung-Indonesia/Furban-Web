// Using native fetch

async function testRegister() {
    try {
        const response = await fetch('http://localhost:8787/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'adminuser',
                password: 'password123',
                email: 'admin@example.com',
                role: 'admin'
            })
        });

        console.log('Register Status:', response.status);
        const text = await response.text();
        console.log('Register Body:', text);

        // Test Login
        const loginResponse = await fetch('http://localhost:8787/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'adminuser',
                password: 'password123'
            })
        });
        console.log('Login Status:', loginResponse.status);
        const loginData = await loginResponse.json();
        const fs = require('fs');
        fs.writeFileSync('token.txt', loginData.token);
        console.log('Token saved to token.txt');

    } catch (error) {
        console.error('Error:', error);
    }
}

testRegister();
