const dns = require('dns');

const domains = [
  'google.com',
  'cluster0.xi3gx5y.mongodb.net'
];

const srvName = '_mongodb._tcp.cluster0.xi3gx5y.mongodb.net';

domains.forEach(domain => {
  console.log(`Resolving A record for ${domain}...`);
  dns.resolve4(domain, (err, addresses) => {
    if (err) {
      console.error(`Error resolving A record for ${domain}: ${err.code}`);
    } else {
      console.log(`Addresses for ${domain}: ${JSON.stringify(addresses)}`);
    }
  });
});

console.log(`Resolving SRV record for ${srvName}...`);
dns.resolveSrv(srvName, (err, addresses) => {
  if (err) {
    console.error(`Error resolving SRV record: ${err.code}`);
  } else {
    console.log(`SRV Records: ${JSON.stringify(addresses)}`);
  }
});

