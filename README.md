## Typescript Interview Test

1. Install postgres & nodejs
2. Create the test database using the `./createdb.sh` script
3. Install the `npm_modules` for this project running `npm install`
4. Run `npm run test` to get the program running (modify the user and password if needed)
5. Examine the typescript code under `server.ts`

### Using the library ramda, what is the result of the following code?

`R.reduce((acc,x) => R.compose(R.flip(R.prepend)(acc), R.sum,R.map(R.add(1)))([x,...acc]), [0])([13, 28]);`

I didn't understand the full code snippet. But, I got some points:

The anonymous function, call itself passing an array with two numbers. 

Reduce is called passing the list of numbers and current iterator.

Compose function reverses functions composition, like right-to-left, the first becomes the last.

Add function is simple as `a + b`; But used with `R.map` apply the function to every element of the list.

The function `R.sum`, Adds all the elements of a list supplied. 

The functions `R.prepend, R.flip` the mode of use, just made my head blow, i didn't get the point.


### If the tables become too big / the accesses too slow, what would you do to improve its speed?

Never use `SELECT * FROM ....` Ask only required fields.

Create some indexes becouse without indexes, every request to the DB would lead to a full scan of the entirety of the table to find results.

We could use cache to answer for some common queries .

PostgreSQL read-only replicas provide a great way to reduce the load on the main DB. It could be a great way to improve its speed.
