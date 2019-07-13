import { getDirOfUrl } from '../transformer';

console.log(getDirOfUrl('https://baidu.com'));

console.log(getDirOfUrl('https://baidu.com/'));

console.log(getDirOfUrl('https://baidu.com/a'));

console.log(getDirOfUrl('https://baidu.com/a.py'));

// console.log(
//   stripBackspaceInUrl(
//     'http://localhost:8082/vulnerabilities/brute/index.html/../../vulnerabilities/sqli'
//   )
// );

// console.log(
//   stripBackspaceInUrl(
//     'http://localhost:8082/vulnerabilities/brute/index.html/../../vulnerabilities/sqli/'
//   )
// );

// console.log(
//   stripBackspaceInUrl(
//     'http://localhost:8082/vulnerabilities/brute/.././vulnerabilities/sqli/'
//   )
// );

// console.log(
//   stripBackspaceInUrl(
//     'http://localhost:8082/vulnerabilities/brute/vulnerabilities/sqli'
//   )
// );

// console.log(
//   stripBackspaceInUrl(
//     'http://localhost:8082/vulnerabilities///brute/vulnerabilities/sqli/#/a/b/../a/'
//   )
// );
