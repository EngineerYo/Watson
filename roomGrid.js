class RoomGrid {
	constructor(data = {}, structures = {}, priority = {}, RCL = {}) {
		this.width = 50
		this.height = 50

		this.data = data
		this.structures = structures
		this.priority = priority
		this.RCL = RCL
	}

	set(x, y, val) {
		if (x > this.width-1 || y > this.height-1 || x < 0 || y < 0) {
			throw new RangeError('Out of bounds')
		}

		let pIndex = Number(this.width*y) + Number(x)

		this.data[pIndex] = val
		return this
	}
    
	setStructure(x, y, val) {
		if (x > this.width-1 || y > this.height-1 || x < 0 || y < 0) {
			throw new RangeError('Out of bounds')
		}

		let pIndex = Number(this.width*y) + Number(x)

		this.structures[pIndex] = val
		return this
	}
		
	setPriority(x, y, val) {
		if (x > this.width-1 || y > this.height-1 || x < 0 || y < 0) {
			throw new RangeError('Out of bounds')
		}

		let pIndex = Number(this.width*y) + Number(x)

		this.priority[pIndex] = val
		return this
	}
	
	setRCL(x, y, val) {
		if (x > this.width-1 || y > this.height-1 || x < 0 || y < 0) {
			throw new RangeError('Out of bounds')
		}

		let pIndex = Number(this.width*y) + Number(x)

		this.RCL[pIndex] = val
		return this
	}

	get(x, y) {
		let pIndex = Number(this.width*y) + Number(x)
		return this.data[pIndex]
	}

	outData() {
		return JSON.stringify(this.data)
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