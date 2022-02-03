// Gameboard module function (Create only one of)
const Gameboard = (function () {
    const gameboard = [null,null,null,null,null,null,null,null,null];
    let gameIsPlaying = false;
    let boardFrozen = false;

    function getBoard () {
        return gameboard
    }

    function updateBoard(square, value) {
        const index = (typeof square === 'string') ? square.split('-')[1] : square
        gameboard[index] = value;
    }

    function highlightWinningSquares (...args) {
        winSquares = (typeof args === 'number') ? [args] : args;
        winSquares.forEach( (square) => {
            gameBoardSquare = document.querySelector(`.game-board-square.square-${square}`);
            gameBoardSquare.classList.add('win-square');
        })
    }

    function removeWinningSquares () {
        winningSquares = document.querySelectorAll('.win-square');
        winningSquares.forEach( (square) => {
            square.classList.remove('win-square');
        })
    }

    function checkForWinner (externalBoard = null) {
        let board = (!externalBoard) ? getBoard() : externalBoard;


        // a, b, c = indexes
        function areEqual (a, b, c) {
            if (board[a] === board[b] && board[a] === board[c] && board[a] !== null) {
                if (!externalBoard) {
                    highlightWinningSquares(a, b, c);
                }
                return true;
            }
            return false;
        }   

        // Check horizontals
        for (let i = 0; i <= 6; i += 3 ) {
            if (areEqual(i, i + 1, i + 2)) {
                return true; 
            }
        }

        // Check verticals
        for (let i = 0; i <= 2; i++) {
            if (areEqual(i, i + 3, i + 6)) {
                return true; 
            }
        }

        // check diag down
        if (areEqual(0, 4, 8)) {
            return true; 
        }

        // check diag up
        if (areEqual(2, 4, 6)) {
            return true; 
        }

        // check if it is a tie
        if (!board.includes(null) && !board.includes(undefined)) { //if board is full
            if (!externalBoard){
                return gameTie();
            }
            return 'tie';
        }
        
        return false;
    }
    
    function gameTie() {
        panelDisplay.textContent = "It's a tie!";
        // Uncomment to highlight all squares
        // highlightWinningSquares(...Array(9).keys()) 
        freezeBoard();
    }

    // Create and fill game board squares
    function createBoard() {
        const gameBoardSelector = document.querySelector('.game-board');

        for(i = 0; i < gameboard.length; i++) {
            const gameBoardSquare = document.createElement('div');
            gameBoardSquare.className = `game-board-square square-${i}`;
            gameBoardSquare.textContent = gameboard[i];
            gameBoardSelector.appendChild(gameBoardSquare);
        }
    }

    function refreshBoard() {
        const gameBoardSelector = document.querySelector('.game-board');

        for(i = 0; i < gameboard.length; i++) {
            gameBoardSquare = document.querySelector(`.game-board-square.square-${i}`);
            gameBoardSquare.textContent = null;
            updateBoard(i, null);
        }
        removeWinningSquares();
        unfreezeBoard();
        gameController.shouldAIPlay();
    }

    function freezeBoard() {
        boardFrozen = true;
    }

    function unfreezeBoard() {
        boardFrozen = false;
    }

    function isFrozen() {
        return boardFrozen;
    }

    function getAvailablePositions (externalBoard = false) {
        let board = (!externalBoard) ? getBoard() : externalBoard;
        let availablePositions = [];

        for (let i = 0; i < board.length; i++) {
            if (board[i] === null || board[i] === undefined) {
                availablePositions.push(i);
            }
        }

        return availablePositions;
    }

    return {
        getBoard,
        updateBoard,
        checkForWinner,
        createBoard,
        refreshBoard,
        freezeBoard,
        isFrozen,
        getAvailablePositions
    }
})()


const Player = (function () {
    let pendingNameChange = null;
    let eugeneActive = false; // Eugene is another name for 'AI'
    
    function changeName(playerName) {
        pendingNameChange = playerName;

        const textArea = document.querySelector('.name');
        textArea.placeholder = playerName.textContent;

        modal.style.display = 'block';
    } 

    function saveNewName() {
        const textArea = document.querySelector('.name');
        
        pendingNameChange.textContent = ( textArea.value.length > 1 ) ? textArea.value : textArea.placeholder;   
        
        textArea.value = '';
        modal.style.display = 'none';

        const ai = document.querySelector('#ai');

        if (ai.checked) {
            activateEugene();
        }
    }
    
    //TODO:
    function activateEugene() {
        //Only allow if not current player who want to be ai
        cp = gameController.getCurrentPlayer()
        ap = pendingNameChange.parentElement.classList[0].split('-')[1]-1
        if (cp !== ap) {
            if (!eugeneActive) {
                eugeneActive = true;
                pendingNameChange.textContent += '(A.I.)'
                gameController.activateAI(ap);
            }
        } else {
            const ai = document.querySelector('#ai');
            ai.checked = false;
        }

    }
    
    return {
        changeName,
        saveNewName,
    }
})()

// game controller module function
const gameController = ( function () {
    gamePieces = ["X", "O"];
    counter = 0;
    aiPlayer = null;
    aiShouldPlay = false;
    humanLastPlaced = null;
    simCounter = 0;

    function getNextPiece () {
        return gamePieces[1 - counter % 2];
    }

    function changePiece () {
        counter ++;
        return gamePieces[counter % 2];
    }

    // TODO
    function placePiece (position) {
        if((Gameboard.isFrozen()) || (position.textContent.length > 0)) {
            return;
        }      

        placeOnPosition(position);
        humanLastPlaced = position;

        // let AI play after person (if activated)
        if (counter % 2 === aiPlayer) {
            return aiLevelDecider()
        }
    }

    function changePlayer() {
        const currentPlayerNumber = (1 - counter % 2) + 1;
        const otherPlayerNumber = 3 - currentPlayerNumber;
        
        const currentPlayerSelector = document.querySelector(`.player-${currentPlayerNumber}`);
        currentPlayerSelector.classList.add('current-player');
        
        const otherPlayerSelector = document.querySelector(`.player-${otherPlayerNumber}`);
        otherPlayerSelector.classList.remove('current-player');
    }

    function getCurrentPlayer() {
        return (counter % 2)
    }

    function announceWinner () {
        const winner = (1 - counter % 2) + 1
        const playerDetails = document.querySelector(`.player-${winner}`).childNodes[1].textContent;

        panelDisplay.textContent = `${playerDetails} wins!`;
        

        // Update score
        const scoreSelector = document.querySelector(`.score-${winner}-value`);
        prev_score = parseInt(scoreSelector.textContent);
        scoreSelector.textContent = prev_score + 1;
    }

    function clearPanelDisplay () {
        panelDisplay.textContent = `${getNextPiece()}`;
    }

    function activateAI (player) {
        // activates ai to play for player one or two.
        aiPlayer = player;
    }

    function shouldAIPlay() {
        if (aiShouldPlay){
            aiLevelDecider();
        }
    }
    
    function aiLevelDecider(level=6){
        if(Gameboard.isFrozen()) {
            aiShouldPlay = true;
            return;
        }
        
        random = Math.floor(Math.random() * 10) + 1;
        let difficulty = document.querySelectorAll('input[name="difficulty"]');
        for (let i = 0; i < difficulty.length; i++) {
            if (difficulty[i].checked) {
                level = difficulty[i].value;
            }
        }

        if (random > level) {
            // Play bad(random) move
            // console.log('Random Move of Flourish!');
            playAIRandom();
        } else{
            // Play serious killer assassin move
            playAISerious();
        }
        aiShouldPlay = false;
    }
    
    function playAIRandom () {
        //get random (empty) position
        let randomPos = ((Math.floor(Math.random() * 10))) % 8;
        while (Gameboard.getBoard()[randomPos] !== null) {
            randomPos = ((Math.floor(Math.random() * 10))) % 8;
        } 
        let position = document.querySelector(`.square-${randomPos}`);
        
        placeOnPosition(position);
    }

    function playAISerious () {
        let bestScore = -Infinity;
        let finalPosition;

        simCounter = counter;        
        let board = [...Gameboard.getBoard()];

        // let boardCopy = JSON.parse(JSON.stringify(Gameboard.getBoard()));
        // console.log({"Copied Board" : board});

        for (let i = 0; i < board.length; i++) {
            if (Gameboard.getAvailablePositions(board).includes(i)) {
                if (Gameboard.getAvailablePositions(board).length === 1) {
                    finalPosition = i;
                } else {
                    // console.log(`Simulating on pos: ${i+1}\n====================`);
                    simulatePlaceOnPosition(i, board);
                    let score = minimax(board, 0, false);
                    undoPlaceOnPosition(i, board);
                    // console.log({"Score" : score});
                    if (score > bestScore) {
                        bestScore = score;
                        finalPosition = i;
                    }
                    // console.log(`\n`);
                }
            }
        }

        let optimal = document.querySelector(`.square-${finalPosition}`);
        placeOnPosition(optimal);
    }

    function getMiniMaxScores (result) {
        function whoWon () {
            const winner = (1 - simCounter % 2) + 1
            const ai = aiPlayer + 1
            // console.log((winner === ai) ? 'Winner: AI' : 'Winner: Human');
            return (winner === ai) ? 1 : -1;
        }   
        return (result === true) ? whoWon() : 0;
    }

    function minimax(board, depth, isMaximizing) {

        function minimaxSimulateGame (bestScore, isMaximizing, mathMinMax) {
            for (let i = 0; i < board.length; i++) {
                if (Gameboard.getAvailablePositions(board).includes(i)) {
                    simulatePlaceOnPosition(i, board);
                    let score = minimax(board, depth + 1, isMaximizing);
                    undoPlaceOnPosition(i, board);
                    bestScore = mathMinMax(score, bestScore);
                }
            }
            return bestScore;
        }
        
        // termimal state
        // TODO: Check what result really returns here
        let result = Gameboard.checkForWinner(board);
        if (result !== false) {
            return getMiniMaxScores(result);
        }

        if (isMaximizing) {
            return minimaxSimulateGame(-Infinity, false, Math.max);
        } else {
            return minimaxSimulateGame(Infinity, true, Math.min);
        }
    }

    function simulatePlaceOnPosition (position, board) {
        simCounter ++;
        // console.log(`I sim "${gamePieces[simCounter % 2]}" placing on square ${position+1}`);        
        board[position] = gamePieces[simCounter % 2]
    }
    
    function undoPlaceOnPosition (position, board) {
        simCounter--;
        board[position] = null;
    }

    function placeOnPosition (position) {
        // Change player
        changePlayer(); // Visual change (highlights current player)
        value = changePiece();

        position.textContent = value;
        Gameboard.updateBoard(position.classList[1], value);

        panelDisplay.textContent = getNextPiece();
        
        // check for winner
        winner = Gameboard.checkForWinner() 
        if (winner) {
            Gameboard.freezeBoard();
            refreshButton.classList.add('highlight-btn');
            announceWinner();
        }
    }
    
    return {
        getCurrentPlayer,
        changePlayer,
        getNextPiece,
        changePiece,
        placePiece,
        clearPanelDisplay,
        activateAI,
        shouldAIPlay,
    }
})()

// const player1 = Player("Jeff", 0);
// const player2 = Player("Bob", 0);
// const players = [player1, player2];

// create board
Gameboard.createBoard();

// Listen for click events and update gameboard + panelDisplay
const panelDisplay = document.querySelector('.game-panel-display');
const gameBoardSelector = document.querySelector('.game-board');
// const startButton = document.querySelector('.btn-start');
const refreshButton = document.querySelector('.btn-refresh');
const player1Name = document.querySelector('.player-1').childNodes[1];
const player2Name = document.querySelector('.player-2').childNodes[1];
const modal = document.querySelector('.modal');
const closeButton = document.querySelector('.btn-close');
const nameInput = document.querySelector('.name');

gameBoardSelector.addEventListener('click', (e) => {
    gameController.placePiece(e.target);    
})

// startButton.addEventListener('click', () => {
//     // Gameboard.refreshBoard();
//     alert('Nothing Yet');
// })
refreshButton.addEventListener('click', () => {
    Gameboard.refreshBoard();
    gameController.clearPanelDisplay();
    refreshButton.classList.remove('highlight-btn');
})

player1Name.addEventListener('click', () => {
    Player.changeName(player1Name);
})
player2Name.addEventListener('click', () => {
    Player.changeName(player2Name);
})

nameInput.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        Player.saveNewName();
    }
})
closeButton.addEventListener('click', () => {
    Player.saveNewName();
})