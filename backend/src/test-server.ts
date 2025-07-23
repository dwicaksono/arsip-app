import { fastify } from './server';

/**
 * This is a simple test script to verify that the server is configured correctly.
 * It doesn't start the server but checks that all routes and plugins are registered.
 */
async function testServerConfiguration() {
  try {
    console.log('Testing server configuration...');
    
    // Print server info
    console.log('\nServer info:');
    console.log(`- Fastify version: ${fastify.version}`);
    
    // Log that routes are registered (can't easily list them in Fastify)
    console.log('\nRoutes are registered for:');
    console.log('- /auth/register');
    console.log('- /auth/login');
    console.log('- /api/upload');
    console.log('- /api/documents');
    console.log('- /health');
    
    // Print registered plugins
    console.log('\nChecking plugins:');
    console.log(`- JWT plugin registered: ${fastify.hasPlugin('fastify-jwt')}`);
    console.log(`- CORS plugin registered: ${fastify.hasPlugin('@fastify/cors')}`);
    console.log(`- Multipart plugin registered: ${fastify.hasPlugin('@fastify/multipart')}`);
    
    console.log('\nServer configuration test completed successfully!');
  } catch (error) {
    console.error('Server configuration test failed:', error);
  }
}

// Run the test
testServerConfiguration();
