import { stripBackspaceInUrl, transfromUrlToResult } from '../transformer';

console.log(
  stripBackspaceInUrl(
    'http://localhost:8082/vulnerabilities/brute/../../vulnerabilities/sqli/'
  )
);

console.log(
  stripBackspaceInUrl(
    'http://localhost:8082/vulnerabilities/brute/.././vulnerabilities/sqli/'
  )
);

console.log(
  stripBackspaceInUrl(
    'http://localhost:8082/vulnerabilities/brute/vulnerabilities/sqli/'
  )
);

console.log(
  transfromUrlToResult('http://localhost:8082/vulnerabilities/sqli/#?id=a')
);

console.log(
  stripBackspaceInUrl(
    'http://localhost:8082/vulnerabilities/brute/vulnerabilities/sqli/#/a/b/../a/'
  )
);
