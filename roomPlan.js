'use strict'

Room.prototype.generateMatrix = function() {
    let grid = new RoomGrid()
    let terrain = this.getTerrain()

    let pathTo = {
        2:  [this.controller.pos],
        1: [..._.map(this.find(FIND_SOURCES), s => s.pos), ..._.map(this.find(FIND_MINERALS), s => s.pos)]
    }
    
    for (let v = 0; v <= 49; v++) {
        for (let i = 0; i <= 49; i++) {
            let newPos = new RoomPosition(i, v, this.name)
            
            // let onDiagonal = !(i%2 == v%2)
            let onDiagonal = 0

            if (newPos.isOnEdge() || newPos.isNearExit()) {
                grid.set(i, v, 5)
                continue
            }

            if (terrain.get(i, v) == 1) {
                grid.set(i, v, 255)
                continue
            }

            let changed = false
            for (let d in pathTo) {
                let nearest = newPos.findClosestByRange(pathTo[d])
                if (newPos.getRangeTo(nearest) <= d) {
                    grid.set(i, v, 5 + onDiagonal)
                    changed = true
                    break
                }
            }
            if (changed == true) {
                continue
            }

            grid.set(i, v, 2)
        }
    }

    if (_.isUndefined(Memory.RoomCache)) {
        Memory.RoomCache = {}
    }

    Memory.RoomCache[this.name] = {data: grid.serialize(), structures: false}
    return grid
}

Room.prototype.populateMatrix = function() {

    if (_.isUndefined(Memory.RoomCache)) {
        Memory.RoomCache = {}
    }

    let bunker = this.memory.Bunker || this.placeBunker()

    if (bunker == false) {
        return false
    }

    let grid = this.generateMatrix()
    this.memory.structures = {}
    this.memory.buildQueue = []

    let posObj = RoomPosition.parse(bunker)
    let rName = this.name

    let pathTo = {
        2:  [this.controller.pos],
        1:  [..._.map(this.find(FIND_SOURCES), s => s.pos), ..._.map(this.find(FIND_MINERALS), s => s.pos)]
    }
    
    for (let i in Memory.Blueprints.Bunker) {
        for (let v in Memory.Blueprints.Bunker[i]) {
            let dx = Number(v.substr(0, 3))
            let dy = Number(v.substr(3, 3))

            grid.setStructure(posObj.x+dx, posObj.y+dy, Memory.Blueprints.Bunker[i][v])
            grid.setRampart(posObj.x+dx, posObj.y+dy, 20)
            grid.setRCL(posObj.x+dx, posObj.y+dy, i)

            if (Memory.Blueprints.Bunker[i][v] == STRUCTURE_ROAD) {
                grid.set(posObj.x+dx, posObj.y+dy, 1)
            }
            else {
                if (dx == -3 && dy == -3) {
                    grid.set(posObj.x+dx, posObj.y+dy, 255)
                }
                else {
                    grid.set(posObj.x+dx, posObj.y+dy, 255)
                }
            }
        }
    }

    for (let i in pathTo) {
        for (let v in pathTo[i]) {
            let path = PathFinder.search(posObj, {pos: pathTo[i][v], range: 1}, {plainCost: 2, swampCost: 5, 
                roomCallback: function(roomName) {
                    if (roomName == rName) {
                        return grid
                    }
                    else if (Game.rooms[roomName] != undefined) {
                        return Game.rooms[roomName].generateMatrix()
                    }
                    else {
                        return new PathFinder.CostMatrix()
                    }
                }
            })
            for (let d in path.path) {
                if (i == 1) {
                    if (d < path.path.length-i) {
                        let priority = (PRIORITY_BY_STRUCTURE[STRUCTURE_ROAD] + (1-(d/path.path.length))).toFixed(4)

                        grid.setStructure(path.path[d].x, path.path[d].y, STRUCTURE_ROAD)
                        grid.set(path.path[d].x, path.path[d].y, 1)
                        grid.setRCL(path.path[d].x, path.path[d].y, 3)
                        grid.setPriority(path.path[d].x, path.path[d].y, priority)
                    }
                    else {
                        grid.setStructure(path.path[d].x, path.path[d].y, STRUCTURE_CONTAINER)
                        grid.set(path.path[d].x, path.path[d].y, 2)
                        grid.setRCL(path.path[d].x, path.path[d].y, 2)
                    }
                }
                else if (i == 2) {
                    if (d < path.path.length - 2) {
                        let priority = (PRIORITY_BY_STRUCTURE[STRUCTURE_ROAD] + (1-(d/path.path.length))).toFixed(4)

                        grid.setStructure(path.path[d].x, path.path[d].y, STRUCTURE_ROAD)
                        grid.set(path.path[d].x, path.path[d].y, 1)
                        grid.setRCL(path.path[d].x, path.path[d].y, 3)
                        grid.setPriority(path.path[d].x, path.path[d].y, priority)
                    }
                    else if (d == path.path.length - 1) {
                        grid.setStructure(path.path[d].x, path.path[d].y, STRUCTURE_CONTAINER)
                        grid.set(path.path[d].x, path.path[d].y, 2)
                        grid.setRCL(path.path[d].x, path.path[d].y, 1)
                    }
                    else if (d == path.path.length - 2) {
                        grid.setStructure(path.path[d].x, path.path[d].y, STRUCTURE_LINK)
                        grid.set(path.path[d].x, path.path[d].y, 255)
                        grid.setRCL(path.path[d].x, path.path[d].y, 5)
                    }
                }
            }
        }
    }

    let mineralSite = _.first(this.find(FIND_MINERALS))
    if (!_.isUndefined(mineralSite)) {
        grid.setStructure(mineralSite.pos.x, mineralSite.pos.y, STRUCTURE_EXTRACTOR)
        grid.setRCL(mineralSite.pos.x, mineralSite.pos.y, 6)
    }

    let adjController = this.controller.pos.getAdjacent()
    for (let i in adjController) {
        let targetPos = RoomPosition.parse(adjController[i])
        grid.setRampart(targetPos.x, targetPos.y, 10)
    }

    Memory.RoomCache[this.name] = {data: grid.serialize(), structures: grid.outStructures(), priority: grid.outPriority(), RCL: grid.outRCL()}
    grid.addStructures(this.name)
    return bunker
}

Room.prototype.placeBunker = function(size = 7) {

    let terrain = this.getTerrain()

    let grid = new Grid()
    let toAvoid = {
        1: [..._.map(this.find(FIND_SOURCES), s => s.pos), ..._.map(this.find(FIND_MINERALS), s => s.pos)],
        2: [this.controller.pos]
    }

    let spots = []

    for (let v = 0; v <= 49; v++) {
        for (let i = 0; i <= 49; i++) {
            let newPos = new RoomPosition(i, v, this.name)

            if (newPos.isOnEdge() || newPos.isNearExit()) {
                grid.set(i, v, 0)
                continue
            }
            
            let avoided = false
            for (let r in toAvoid) {
                let nearest = newPos.findClosestByRange(toAvoid[r])
                if (newPos.getRangeTo(nearest) <= r) {
                    grid.set(i, v, 0)
                    avoided = true
                    break
                }
            }
            if (avoided == true) {
                continue
            }

            if (terrain.get(i, v) == 1) {
                grid.set(i, v, 0)
                continue
            }

            let adj = [grid.get(i-1, v), grid.get(i, v-1), grid.get(i-1, v-1)]
            let score = Math.min(...adj)+1
            grid.set(i, v, score)
            if (score > size*2+1) {
                spots.push(newPos)
            }

        }
    }
    
    if (spots.length == 0) {
        // no spot available
        return false
    }

    let targetPos = _.min(spots, s => s.add(-7, -7).getRangeTo(this.controller.pos))
    let bunkerPos = targetPos.add(-7, -7)
    this.memory.Bunker = RoomPosition.serialize(bunkerPos)

    Memory.toDisplay = grid.data
    return RoomPosition.serialize(bunkerPos)
}


//      //      //      //      //      //      //      //      //      //

//      //      //      //      //      //      //      //      //      //

Room.prototype.getBuildings = function(centerPos, refPos, rng, lvl) {
  let structs = centerPos.findInRange(FIND_STRUCTURES, rng)
  Memory.Blueprints['Extension1'][lvl] = {}
  let buildings = {}
  
  for (let i in structs) {
      let dx = structs[i].pos.x - centerPos.x
      let dy = structs[i].pos.y - centerPos.y
      
      let newPos = centerPos.add(dx, dy)
      let testPos = refPos.add(dx, dy)
      let tStruct = _.find(testPos.lookFor(LOOK_STRUCTURES), s => s.structureType == structs[i].structureType)
      
      if (tStruct !== undefined) {
          continue
      }
      
      let xStr = dx.addLeadingZeros(2, true)
      let yStr = dy.addLeadingZeros(2, true)
      
      let dPosStr = xStr + yStr
      
      if (!_.has(buildings, dPosStr)) {
          buildings[dPosStr] = []
          
      }
      buildings[dPosStr].push(structs[i].structureType)
  }
  
  Memory.Blueprints.Extension1[lvl] = buildings
}
