/**
 * WTChessBoard - A small & fast javascript chess board
 * 
 * @author Anuj Kumar <webtricks.ak@gmail.com>
 * @link https://github.com/wtricks/wtchessboard
 * @link https://instagram.com/webtricks.ak
 */
const WTChessBoard = () => {
  const ALPHA = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        EVENTS = 'ontouchstart' in window || navigator.msMaxTouchPoints ? ['touchstart', 'touchmove', 'touchend'] : ['mousedown', 'mousemove', 'mouseup'],
        PIECE = {
    k: 'king',
    q: 'queen',
    n: 'knight',
    p: 'pawn',
    r: 'rook',
    b: 'bishop'
  };

  let initial = true,
      boardRef,
      innerRef,
      _square = {},
      _piece = {},
      _current = {},
      _container = {},
      _border,
      _turn,
      _animate,
      _theme,
      _pause,
      _dragable,
      _selected,
      _wSquare,
      _wBorder,
      light = [],
      _wBoard,
      x,
      y,
      _elem,
      _temp,
      _moves,
      _move,
      _assets,
      _position = {},
      _rotate,
      _Panimate;

  const graySquare = (remove = false) => {
    for (type in _current) _current[type].forEach(sqr => {
      classToggle(_square[sqr], type, remove);
      type == 'capture' && classToggle(_piece[sqr], type, remove);
    });
  };

  const index = num => {
    let first = Math.floor(num / 8) + 1;
    let second = num - (8 * first - 8);
    return ALPHA[second] + first;
  };

  const classToggle = (el, className, remove = false) => {
    if (!el) return;
    if (!remove) el.classList.add(className);else el.classList.remove(className);
  };

  const position = (square, x = null, y = null, oppsite = false) => {
    if (_piece[square]) {
      var _x, _y;

      if (!x || !y) _piece[square].square = square;
      x = (_x = x) != null ? _x : _position[square].x - _wBoard.x;
      y = (_y = y) != null ? _y : _position[square].y - _wBoard.y;

      if (!oppsite) {
        _piece[square].style.left = x + 'px';
        _piece[square].style.top = y + 'px';
        _piece[square].style.right = _piece[square].style.bottom = 'unset';
      } else {
        _piece[square].style.right = x + 'px';
        _piece[square].style.bottom = y + 'px';
        _piece[square].style.left = _piece[square].style.top = 'unset';
      }
    }
  };

  const measureSquare = () => {
    _wSquare = _square.A1.offsetHeight;
    _wBoard = innerRef.getBoundingClientRect();
    _wBorder = _border ? innerRef.querySelector('.wt-square').offsetWidth : 0;
    boardRef.style.setProperty('--square', _wSquare + 'px');

    for (let square in _square) {
      _position[square] = {
        x: _square[square].getBoundingClientRect().x,
        y: _square[square].getBoundingClientRect().y
      };
      if (_piece[square]) position(square);
    }
  };

  const addEvent = (square, type) => {
    if (type) _piece[square].addEventListener(EVENTS[0], onDrag);else _piece[square].addEventListener('click', onClick);
  };

  const onDrag = event => {
    onClick(event); // Same as onClick

    if (_animate) classToggle(_piece[_selected], 'animate', true);
    classToggle(_piece[_selected], 'active');
    document.addEventListener(EVENTS[1], dragMove);
    document.addEventListener(EVENTS[2], dragLeave);
  };

  const dragMove = event => {
    if (EVENTS[0] !== 'touchstart') x = event.pageX, y = event.pageY;else x = event.touches[0].pageX, y = event.touches[0].pageY;
    position(_selected, x - (_wBoard.x + _wSquare * 0.5), y - (_wBoard.y + _wSquare * 0.5), _turn == 'b' && _rotate);
    x = Math.floor((x - (_wBoard.x + _wBorder)) / _wSquare);
    y = Math.floor((y - (_wBoard.y + _wBorder)) / _wSquare);
    if (_turn == 'b') x = 7 - x, y = 7 - y;
    _elem = index((7 - y) * 8 + x);

    if (_elem = _elem[1] < 1 ? null : _elem) {
      if (_temp) classToggle(_square[_temp], 'hover', true);
      if (_container.some(square => square == _elem)) classToggle(_square[_temp = _elem], 'hover');
    }
  };

  const dragLeave = () => {
    graySquare(true);
    if (_animate) classToggle(_piece[_selected], 'animate');
    classToggle(_piece[_selected], 'active', true);
    document.removeEventListener(EVENTS[1], dragMove);
    document.removeEventListener(EVENTS[2], dragLeave);
    if (_elem && _container.some(sqr => sqr == _elem)) onSquareClick(_elem, false);else position(_selected);
    if (_temp) classToggle(_square[_temp], 'hover', true);
    _temp = null;
    _container = {};
  };

  const onClick = event => {
    let square = event.target.square,
        color = event.target.color;

    if (_piece[square]) {
      if (_selected && color !== _turn && _current.capture.some(sqr => sqr == square)) {
        _move(_selected, square);

        graySquare(true);
        _selected = null, _current = {};
      } else {
        graySquare(true);
        _current = validateMoves(_moves(square)), _selected = square;
        _container = _current.valid.concat(_current.capture);
        graySquare(false);
      }
    }
  };

  const removePiece = square => {
    if (_piece[square]) {
      _piece[square].remove();

      delete _piece[square];
    }

    return "At provided square, there is no piece";
  };

  const movePiece = (from, to) => {
    if (_piece[from]) {
      removeLight(); // remove hightlights

      _piece[to] = _piece[from], position(to);
      delete _piece[from];
    }
  };

  const onSquareClick = (square, callBySquare = true) => {
    if (square.target) square = square.target.square;
    if (_dragable && callBySquare) return;

    if (_selected && _container.some(sqr => sqr == square)) {
      _move(_selected, square);

      graySquare(true);
      _selected = null, _current = {};
    }
  };

  const toggleBorder = () => {
    if (_animate && !initial) for (const square in _piece) classToggle(_piece[square], 'animate', true);
    classToggle(boardRef, 'border', !!_border);
    _border = !_border;
    if (!initial) measureSquare();
    if (_animate && !initial) setTimeout(() => {
      for (const square in _piece) classToggle(_piece[square], 'animate');
    }, _Panimate);
  };

  const togglePuase = () => {
    classToggle(boardRef, 'pause', !!_pause);
    _pause = !_pause;
  };

  const toggleTurn = (turn = 'b') => {
    let same = (_turn = turn.toLowerCase()) == 'b';
    if (_rotate) setTimeout(() => {
      classToggle(boardRef, 'black', !same);
    }, _Panimate);
  };

  const toggleTheme = () => {
    classToggle(boardRef, 'marble', !!_theme);
    _theme = !_theme;
  };

  const toggleDragClick = () => {
    for (const square in _piece) {
      if (_dragable) _piece[square].removeEventListener(EVENTS[0], onDrag);else _piece[square].removeEventListener('click', onClick);
      addEvent(square, !_dragable);
    }

    _dragable = !_dragable;
  };

  const createBoard = (border, theme, el, animate, boardAnimationSpeed, pieceAnimationSpeed) => {
    if (!initial) return;
    el.innerHTML = '<div class="wt-chess"><div class="wt-chess-inner"></div></div>';
    innerRef = el = el.querySelector('.wt-chess-inner');
    boardRef = document.querySelector('.wt-chess');
    (_animate = animate) && innerRef.classList.add('animate');
    border && toggleBorder();
    boardRef.classList.add(theme);
    boardRef.style.setProperty('--pieceTransition', pieceAnimationSpeed + 's');
    boardRef.style.setProperty('--boardTransition', boardAnimationSpeed + 's');
    let count = 0;
    line = 8, sqr = '';
    initial = false;

    for (let i = 0; i < 100; i++) {
      let els = document.createElement('div');
      classToggle(els, 'wt-square');
      if (i < 10 || i > 89) classToggle(els, "wt-border-height");
      if ((i + 1) % 10 == 0 || i % 10 == 0) classToggle(els, "wt-border-width");
      if ((i % 10 == 0 || (i + 1) % 10 == 0) && i != 0 && i != 90 && i != 9 && i != 99) els.textContent = Math.floor((i % 10 == 0 ? 9 : 10) - i / 10);else if (i > 0 && i < 9 || i > 90 && i < 99) els.textContent = ALPHA[(i > 10 ? i - 90 : i) - 1].toLowerCase();else if (i > 10 && i < 89) {
        _square[sqr = index((8 - count) * 8 - line)] = els;
        els.classList.add((i - count) % 2 == 0 ? 'black' : 'white');
        els.addEventListener('click', onSquareClick);
        if ((i + 2) % 10 == 0) count++;
        if (--line == 0) line = 8;
        els.square = sqr;
      }
      el.append(els);
    }
  };

  const addPiece = (square, piece, color) => {
    piece = piece.toLowerCase();
    if (!PIECE.hasOwnProperty(piece)) return 'Unknown piece name given';
    if (_piece.hasOwnProperty(square)) return 'Two piece can not be placed at same square';
    let el = document.createElement('div');
    classToggle(el, 'wt-piece');
    el.style.backgroundImage = `url(${_assets}${color.toLowerCase()}_${PIECE[piece.toLowerCase()]}.png)`;
    if (_animate) classToggle(el, 'animate');
    _piece[square] = el, _piece[square].color = color;
    position(square);
    innerRef.append(el);
    addEvent(square, _dragable);
  };

  const validateMoves = moves => {
    let move = {
      valid: [],
      capture: []
    };
    if (moves && Array.isArray(moves.valid)) move.valid = moves.valid;
    if (moves && Array.isArray(moves.capture)) move.capture = moves.capture;
    return move;
  };

  const load = config => {
    let {
      rotate,
      theme,
      border,
      el,
      dragable,
      moves,
      move,
      assets,
      animate,
      boardAnimationSpeed,
      pieceAnimationSpeed
    } = config != null ? config : {
      theme: 'wooden',
      border: true,
      animate: false,
      dragable: false
    };
    if (!(el = document.querySelector(el))) return `Invalid selector '${el}' given`;
    if (typeof moves != 'function') return `Invalid callback function given ${moves}`;
    if (typeof move != 'function') return `Invalid callback function given ${move}`;
    theme = ['wooden', 'marble'].some(th => th == theme) ? theme : 'wooden';
    createBoard(border, theme, el, animate, boardAnimationSpeed != null ? boardAnimationSpeed : 1.2, _Panimate = pieceAnimationSpeed != null ? pieceAnimationSpeed : 0.5);
    measureSquare();
    _dragable = dragable, _assets = assets, _move = move, _moves = moves, _rotate = rotate ? true : false;
    window.addEventListener('resize', measureSquare);
  };

  const highlight = (square, remove = false) => {
    if (!_square[square]) return 'Unknown position of board "' + square + '"';
    light.push(square);
    classToggle(_square[square], 'check', remove);
    classToggle(_square[square], 'hover', remove);
  };

  const removeLight = () => {
    if (light.length == 0) return;
    light.forEach(square => highlight(square, true));
    light.length = 0;
  };

  return {
    addPiece,
    removePiece,
    highlight,
    movePiece,
    toggleBorder,
    toggleDragClick,
    togglePuase,
    toggleTheme,
    load,
    toggleTurn
  };
};
