const ply = document.getElementById("player");
const plyHP = document.getElementById("playerHP");
const enm = document.getElementById("enemy");
const enmHP = document.getElementById("enemyHP");
const atk = document.getElementById("attack");
const special = document.getElementById("specialMoves");
const specialText = document.getElementById("specialText");
const neet = document.getElementById("needTurn");
const exp =document.getElementById("experience");
const lev = document.getElementById("level");
const dft = document.getElementById("defeat");
const itm = document.getElementById("item");
const pon = document.getElementById("portion");

let state = {
players: [{
    id: 1,
    name: "Hero",
    hp: 300,
    attack: 40,
    exp: 0,
    level: 0,
    inventory: ["Portion"]
   },
   {
    id: 2,
    name: "enemy",
    hp: 80,
    attack: 5,
    type: "ノーマル",
    hasHealed: false
   }],
defeatCount: 0,
specialTurn: 0,
turn: 1,
logs: [],
phase: "player"
};

const skills = {
    タンク: "guard",
    バーサーカー: "double",
    ノーマル: "null"
}

async function getPokemon()  {
    const id = Math.floor(Math.random() * 151) +1;

    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();

    const pokemon = {
        name: data.name,
        hp: data.stats[0].base_stat,
        img: data.sprites.front_default
    };
    return pokemon;
}

function attackShock(state, attackerId, targetId, damage, terget) {
    let finalDamage = damage
    const target = state.players.find(p => p.id === targetId);
    const attacker = state.players.find(p => p.id === attackerId);

    const newStates = {
        ...state,
        players: state.players.map(p => {
                if (targetId === p.id) {
                    return {
                        ...p,
                        hp: Math.max(0, p.hp - finalDamage),
                    };
                }
                return p;
        }),
    };
    showDamage(finalDamage, terget);
    return addLog( newStates, `${attacker.name}の攻撃！ ${target.name}に${finalDamage}ダメージ`, "black" );
}

function handleDefeat(state) {
    if(state.players[1].hp <= 0) {
        const newStates = {
            ...state,
            defeatCount: state.defeatCount + 1,
        };
        return addLog(newStates, "敵を撃破しました！", "black");
    }
    return state;
}

function getExp(state, targetId) {
    const target = state.players.find(p => p.id === targetId);

    if (state.players[1].hp <= 0){
        const newStates = {
            ...state,
            players: state.players.map(p => {
                if (targetId === p.id && p.exp <= 100){
                    return {
                        ...p,
                        exp: Math.max(0, p.exp + 50),
                    };
                }
                return p;
            }),
        };
        return addLog(newStates, `${target.name}が経験値を50獲得しました`, "black");
    }
    return state;
}

function levelUP(state, targetId) {
    const target = state.players.find(p => p.id === targetId);
    if (target.exp >= 100){
        const newStates = {
            ...state,
            players: state.players.map(p => {
                if (targetId === p.id ) {
                    return {
                        ...p,
                        hp: p.hp + 40,
                        attack: p.attack + 7,
                        exp: p.exp - 100,
                        level : p.level + 1
                    };
                }
                return p;
            })
        }
        return addLog(newStates, `${target.name}のレベルが上がりました！`, "black");
    }
    return state;
}

function specialMoves(state) {
    const newStates = {
        ...state,
        players: state.players.map(p => {
            if (p.id === 2){
                return {
                    ...p,
                    hp: Math.max(0, p.hp - 200)
                };
            }
            return p;
        }),
        phase: "enemy",
        specialTurn: 10
    };

    return addLog(newStates, `${state.players[0].name}の必殺技！${state.players[1].name}が200ダメージくらった!`);
}

async function spawnEnemy(state) {
    const pokemon = await getPokemon();
    const type = pokemon.name;
    const stats = {
        hp: pokemon.hp * 2,
        attack: Math.floor(pokemon.hp / 3)
    }
    document.getElementById("enemyImage").src = pokemon.img;

    const newStates = {
        ...state,
        players: state.players.map(p => {
            if (p.id === 2 ) {
                return {
                    ...p,
                    type,
                    ...stats,
                    hasHealed: false
                };
            }
            return p;
        })
    };
    return addLog(newStates, `${type}が出現しました`, "black");
}

function healEnemy(state) {
    const enemy = state.players[1];

    if (enemy.hasHealed) return state;

    if (enemy.hp > 30) return state;

    const newStates = {
        ...state,
        players: state.players.map(p => {
            if (p.id === 2) {
                return {
                    ...p,
                    hp: p.hp + 30,
                    hasHealed: true
                };
            }
        return p;
        })
    };
    return addLog(newStates, "敵がヒールを使い、敵HPが30回復した!", "green");
}

function usePotion(state, targetId) {
    const target = state.players.find(p => p.id === targetId);
    if (state.players[0].inventory.includes("Portion")) {
        const newStates = {
            ...state,
            players: state.players.map(p => {
                if (targetId === p.id) {
                    return {
                        ...p,
                        hp: Math.min(300, p.hp + 90) + state.players[0].level * 20,
                        inventory: p.inventory.filter((item, index) => index !== 0)
                    };
                }
                return p;
            }),
        }
            return addLog(newStates, `${target.name}がポーションを使用した！`, "green");
    }
    return state;
}

function logChange(log, logsArea) {
    const p = document.createElement("p");
    p.textContent = `[ターン${log.turn}] ${log.message}`;
    p.classList.add(log.color);
    logsArea.appendChild(p);
}
   
async function renderLog(logs) {
    const logsArea = document.getElementById("log")

    const currentTurn = logs[logs.length - 1].turn

    if (logsArea.dataset.turn != currentTurn) {
        logsArea.innerHTML = ""
        logsArea.dataset.turn = currentTurn
    }
    
    const turnLogs = logs.filter(log => log.turn === currentTurn)
    const startIndex = logsArea.children.length
    const newLogs = turnLogs.slice(startIndex)

    for (const log of newLogs){
        logChange(log, logsArea)

        await wait(150)
    }
}

function addLog(state, messageContent, textColor) {
    return {
        ...state,
        logs: [...state.logs, {
            turn: state.turn,
            message: messageContent,
            color: textColor
        }]
    };
}

function decideEnemyAction(enemy) {
    if (enemy.hp <= 30 && !enemy.hasHealed) return "heal";
    if (enemy.hp <= 60 && Math.random() > 0.5) return "strong";
    return "nomal";
}

function playerAction(state) {
        let newState = attackShock(state, 1, 2, state.players[0].attack, "enemyDamageLayer");
        newState = handleDefeat(newState);
        newState = getExp(newState, 1);
        newState = levelUP(newState, 1);
        return newState;
}

function specialPlayerAction(state) {
    let newState = specialMoves(state);
    newState = handleDefeat(newState);
    newState = getExp(newState, 1);
    newState = levelUP(newState, 1);
    return newState;
}

async function enemyAction(state) {
    let newState = state;
    if (state.players[1].hp <= 0) {
        newState = await spawnEnemy(state);
    }
    const enemy = newState.players[1];
    if (decideEnemyAction(enemy) === "heal")   return healEnemy(newState);

    if (decideEnemyAction(enemy) === "strong") {
        newState = attackShock(newState, 2, 1, Math.floor(enemy.attack * 1.5), "playerDamageLayer");
        return addLog(newState, `${enemy.name}からの強攻撃！`, "red");
    }

    return attackShock(newState, 2, 1, enemy.attack, "playerDamageLayer");
}

async function nextPhase(state) {
    if (state.phase === "player") {
        const next = playerAction(state);
        return {...next, phase: "enemy"};
    }

    if (state.phase === "enemy") {
        const next = await enemyAction(state);
        return {...next, phase: "player", turn: state.turn + 1, specialTurn: Math.max(0, state.specialTurn -1)};
    }
}

function specialPhase(state) {
    const next = specialPlayerAction(state);
    return {...next, phase: "enemy"};
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function textChange() {
    const playerMaxHp = 300
    const enemyMaxHp = 200

    const playerPercent = state.players[0].hp / playerMaxHp * 100
    const enemyPercent = state.players[1].hp / enemyMaxHp * 100

    playerHpBar.style.width = playerPercent + "%"
    enemyHpBar.style.width = enemyPercent + "%"

    dft.textContent = state.defeatCount;
    exp.textContent = state.players[0].exp;
    lev.textContent = state.players[0].level;
    enm.textContent = state.players[1].type;
    neet.textContent = Math.max(0, state.specialTurn);

     if (state.specialTurn === 0) {
        special.style.backgroundColor = "yellow";
        special.disabled = false;
    } else if (state.specialTurn > 0) {
        special.style.backgroundColor = "white";
        special.desabled = true;
    }
}

function enemyFlash() {
    const enemyBox = document.getElementById("enemyBox");

    enemyBox.classList.add("hit")
    setTimeout(() => {
        enemyBox.classList.remove("hit");
    }, 300);
}

function showDamage(damage, terget){
    const layer = document.getElementById(terget);
    const dmg = document.createElement("div");
    dmg.classList.add("damege");

    dmg.textContent = "-" + damage;

    layer.appendChild(dmg);

    setTimeout(() =>{
        dmg.remove();
    }, 800);
}

async function setState(newState) {
    state = newState;

    await renderLog(state.logs);
    textChange();
    if (state.players[0].hp <= 0) {
        gameOver();
        return;
    }
    enemyFlash();

    await wait(500)
    await enemyTurn();
}

function gameOver() {
    document.getElementById("gameOverText").textContent = "GAME OVER";

    atk.disabled = true;
    itm.disabled = true;
    special.disabled = true;
}

async function playerTurn() {
    if (state.phase !== "player") return;
    await setState(await nextPhase(state));
}

async function enemyTurn() {
    if (state.phase !== "enemy") return ;
    await setState(await nextPhase(state));
}

atk.addEventListener('click', () => {
    playerTurn();
})

itm.addEventListener('click', () => {
    setState(usePotion(state, 1));
});

special.addEventListener('click', () => {
    if (state.phase !== "player") return;
    if (state.specialTurn > 0) return;
    setState(specialPhase(state));
});
