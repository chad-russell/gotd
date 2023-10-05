# TODO

- [x] select-none on sudoku notes
- [ ] All saves should include a timestamp. Use this to sync between local storage and the server.
- [ ] Save sudoku and squareword responses in local storage. 
      Make sure the local storage is from the same day, if it isn't then delete it.
      Same logic as server - if it says we've won then refuse any other state. Don't check server and 
      When retrieving from server, check if we have anything in local storage from within the last minute.
      If so, then use that.
      When saving on the server, include the timestamp of the last local storage save. If the server has something newer, reject it and
      tell the client they need to load again.

