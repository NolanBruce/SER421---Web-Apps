A simple SPA application for a simplified version of CLUE.


I realized after finishing this lab that my understanding of sessionStorage and localStorage was a bit incomplete. I didn't realize they operate similar to cookies with key/value pairs, so I accessed them by numerical index values like an array.

This means that for sessionStorage, the first three values are the secret triplet, followed by the player's cards, then the CPU's cards (determined by the number of possible cards based on the size of the suspects, weapons, and rooms arrays), followed by the number of turns so far this game. After that, the session storage alternates between a string representing the guesses of the user and CPU.

For localStorage, localStorage[0] is the number of player wins, localStorage[1] is the number of CPU wins. After that, there is just a series of strings representing each completed game's result.

I just wanted to explain that here, so that the grader isn't scratching their head wondering why I chose to implement localStorage and sessionStorage in such a convoluted way.