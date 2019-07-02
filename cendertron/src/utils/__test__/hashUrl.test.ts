import { hashUrl } from '../model';

console.log(
  hashUrl('http://localhost:8082/vulnerabilities/sqli/#?id=a', 'GET')
);

// console.log(
//   hashUrl({
//     url: 'http://localhost:8082/vulnerabilities/sqli/',
//     parsedUrl: parseUrl('http://localhost:8082/vulnerabilities/sqli/')
//   })
// );

// console.log(parseUrl('http://localhost:8082/vulnerabilities/sqli/'));
