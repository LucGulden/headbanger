const Redis = require('ioredis');

const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

redis.on('connect', () => {
  console.log('✅ Connexion Redis OK !');
  redis.set('test', 'hello from WSL');
  redis.get('test', (err, result) => {
    console.log('Test lecture/écriture:', result);
    redis.quit();
  });
});

redis.on('error', (err) => {
  console.error('❌ Erreur Redis:', err);
});
