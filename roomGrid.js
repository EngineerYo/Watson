	class RoomGrid extends PathFinder.CostMatrix {
		constructor() {
			super([])
			this.width = 50
			this.height = 50

			this.structures = {}
			this.priority = {}
			this.RCL = {}
			this.ramparts = {}
		}
			
		setStructure(x, y, val) {
			if (x > this.width-1 || y > this.height-1 || x < 0 || y < 0) {
				throw new RangeError('Out of bounds')
			}

			let pIndex = Number(this.height*x) + Number(y)

			this.structures[pIndex] = val
			return this
		}
			
		setPriority(x, y, val) {
			if (x > this.width-1 || y > this.height-1 || x < 0 || y < 0) {
				throw new RangeError('Out of bounds')
			}

			let pIndex = Number(this.height*x) + Number(y)

			this.priority[pIndex] = val
			return this
		}
		
		setRCL(x, y, val) {
			if (x > this.width-1 || y > this.height-1 || x < 0 || y < 0) {
				throw new RangeError('Out of bounds')
			}

			let pIndex = Number(this.height*x) + Number(y)

			this.RCL[pIndex] = val
			return this
		}

		setRampart(x, y, p) {
			if (x > this.width-1 || y > this.height-1 || x < 0 || y < 0) {
				throw new RangeError('Out of bounds')
			}

			let pIndex = Number(this.height*x) + Number(y)
			if (_.isUndefined(this.ramparts[pIndex])) {
				this.ramparts[pIndex] = p
			}
			else {
				this.ramparts[pIndex] = undefined
			}
		}

		addStructures(roomName) {
			for (let i in this.structures) {
				let x = Math.floor(i/50)
				let y = Number(i)-Number(x*50)

				let newPos = new RoomPosition(x, y, roomName)
				let posStr = RoomPosition.serialize(newPos)

				Game.rooms[roomName].addStructure(posStr, this.structures[i], this.RCL[i], this.priority[i])
			}

			// for (let i in this.ramparts) {
			// 	let x = Math.floor(i/50)
			// 	let y = Number(i) - Number(x*50)

			// 	let newPos = new RoomPosition(x, y, roomName)
			// 	let posStr = RoomPosition.serialize(newPos)

			// 	Game.rooms[roomName].addStructure(posStr, STRUCTURE_RAMPART, 6, this.ramparts[i])
			// }

		}

		outStructures() {
			return JSON.stringify(this.structures)
		}

		outPriority() {
			return JSON.stringify(this.priority)
		}

		outRCL() {
			return JSON.stringify(this.RCL)
		}
	}

	module.exports = RoomGrid