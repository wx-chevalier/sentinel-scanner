import { hashUrl } from '../model';

console.log(hashUrl({ url: 'https://www.patreon.com/bePatron?c=784328' }));
console.log(
  hashUrl({ url: 'https://jsonplaceholder.typicode.com/posts/1/comments' })
);
