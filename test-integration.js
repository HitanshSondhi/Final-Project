import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testAuthIntegration() {
    console.log('🧪 Testing eClinicPro Authentication Integration...\n');

    try {
        // Test 1: Check if server is running
        console.log('1. Testing server connectivity...');
        const response = await axios.get(`${API_BASE_URL}/users`);
        console.log('✅ Backend server is running and accessible\n');

        // Test 2: Test registration endpoint
        console.log('2. Testing user registration...');
        const testUser = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'testpassword123',
            isrole: 'patient'
        };

        try {
            const registerResponse = await axios.post(`${API_BASE_URL}/users/register`, testUser);
            console.log('✅ Registration endpoint working:', registerResponse.data.message);
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('✅ Registration endpoint working (user already exists)');
            } else {
                console.log('❌ Registration failed:', error.response?.data?.message || error.message);
            }
        }

        console.log('\n🎉 Integration test completed!');
        console.log('\n📱 Frontend: http://localhost:3001');
        console.log('🔧 Backend API: http://localhost:3000');
        console.log('\n✨ You can now:');
        console.log('   - Open http://localhost:3001 in your browser');
        console.log('   - Click "Login / Sign Up" to test authentication');
        console.log('   - Register a new account or login with existing credentials');

    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   - Make sure MongoDB is running');
        console.log('   - Make sure Redis is running');
        console.log('   - Check that both servers are started');
    }
}

testAuthIntegration();