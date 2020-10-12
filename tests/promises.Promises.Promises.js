var p2 = new Promise(function(resolve, reject) {
  resolve(2);
});

p2.then(function(value) {
  console.log(value); // 1
  return value + 1;
})
  .then((value) => {
    console.log('intermediate value:', value);
    return value;
  })
  .then(function(value) {
    console.log(value + ' - A synchronous value works'); // 2 - A synchronous value works
  });

p2.then(function(value) {
  console.log(value); // 1
});
