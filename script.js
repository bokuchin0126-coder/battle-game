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
    attack: 25,
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
    skill: null,
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

function attackShock(state, attackerId, targetId, damage) {
    let finalDamage = damage
    const target = state.players.find(p => p.id === targetId);
    const attacker = state.players.find(p => p.id === attackerId);

    if (target.skill === "guard" && Math.random() < 0.33) {
        finalDamage =  Math.floor(damage / 2);
    }
    else if (attacker.skill === "double" && Math.random() < 0.33) {
        finalDamage = damage * 2;
    }

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
                        hp: p.hp + 60,
                        attack: p.attack + 15,
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

function getRandomType() {
    const r = Math.random();
    if (r < 0.33) return "ノーマル";
    if (r < 0.66) return "タンク";
    return "バーサーカー";
}

function createEnemyStats(type, defeatCount) {

    if (type === "ノーマル") {
        return {
            hp: 80 + defeatCount * 10,
            attack: 5 + defeatCount * 2,
        };
    }

    if (type === "タンク") {
        return {
            hp: 150 + defeatCount * 15,
            attack: 3 + defeatCount * 1,
        };
    }

    if (type === "バーサーカー") {
        return {
            hp: 50 + defeatCount * 5,
            attack: 10 + defeatCount * 4,
        };
    }
}

function spawnEnemy(state) {
    const type = getRandomType();
    const stats = createEnemyStats(type, state.defeatCount);
    const skill = skills[type];

    const newStates = {
        ...state,
        players: state.players.map(p => {
            if (p.id === 2 ) {
                return {
                    ...p,
                    type,
                    skill,
                    ...stats,
                    hasHealed: false
                };
            }
            return p;
        })
    };

    if (state.players[1].hp <= 0) {
        return addLog(newStates, `${type}タイプの敵が出現しました`, "black");
    }
    return state;
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
   
function renderLog(logs) {
    const logsArea = document.getElementById("log")
    logsArea.innerHTML = ""

    logs.slice(-6).forEach(log => {
        const p = document.createElement("p");
        p.textContent = `[ターン${log.turn}] ${log.message}`;
        p.classList.add(log.color);
        logsArea.appendChild(p);
    });
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
        let newState = attackShock(state, 1, 2, state.players[0].attack);
        newState = handleDefeat(newState);
        newState = getExp(newState, 1);
        newState = levelUP(newState, 1);
        return newState;
}

function enemyAction(state) {
    let newState = spawnEnemy(state);
    const enemy = newState.players[1];
    if (decideEnemyAction(enemy) === "heal")   return healEnemy(newState);

    if (decideEnemyAction(enemy) === "strong") {
        newState = attackShock(newState, 2, 1, Math.floor(enemy.attack * 1.5));
        return addLog(newState, `${enemy.name}からの強攻撃！`, "red");
    }

    return attackShock(newState, 2, 1, enemy.attack);
}

function nextPhase(state) {
    if (state.phase === "player") {
        const next = playerAction(state);
        return {...next, phase: "enemy"};
    }

    if (state.phase === "enemy") {
        const next = enemyAction(state);
        return {...next, phase: "player", turn: state.turn + 1, specialTurn: Math.max(0, state.specialTurn -1)};
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function textChange() {
    enmHP.textContent = state.players[1].hp;
    dft.textContent = state.defeatCount;
    plyHP.textContent = state.players[0].hp;
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

async function setState(newState) {
    state = newState;
    renderLog(state.logs);
    textChange();

    await wait(500)
    enemyTurn();
}

function playerTurn() {
    if (state.phase !== "player") return;
    setState(nextPhase(state));
}

function enemyTurn() {
    if (state.phase !== "enemy") return ;
    setState(nextPhase(state));
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

    setState(nextPhase(specialMoves(state)));
});
