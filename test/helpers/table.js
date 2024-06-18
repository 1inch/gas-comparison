const Table = require('cli-table3');
const chalk = require('chalk');

function createGasUsedTable (tableHeader, firstColumnHeader) {
    return new GasUsedTable({
        header: tableHeader,
        firstColumn: { content: firstColumnHeader },
        modifyElementHook: displayGasUsedElement,
        compareElementsHook: compareGasUsedElements,
    });
}

function displayGasUsedElement (element) {
    return Number(element).toLocaleString('en');
}

function compareGasUsedElements (displayedElement1, displayedElement2) {
    return parseInt(displayedElement2.replace(/,/g, '')) - parseInt(displayedElement1.replace(/,/g, ''));
}

class GasUsedTable {
    DEFAULT_FIRST_COLUMN = { columnAlign: 'left', headAlign: 'center', content: 'case' };
    DEFAULT_COLORS = { best: 'green', worst: 'red', neutral: 'white' };
    header = null;
    table = null;
    colors = null;

    constructor ({header, firstColumn, modifyElementHook, compareElementsHook, colors}) {
        this.createTable({header, firstColumn});
        this.setColors(colors);
        if (modifyElementHook) {
            this.modifyElementHook = modifyElementHook;
        }
        if (compareElementsHook) {
            this.compareElementsHook = compareElementsHook;
        }
    }

    createTable ({header, firstColumn}) {
        firstColumn = firstColumn || this.DEFAULT_FIRST_COLUMN;
        this.table = new Table({
            head: header ? [{ colSpan: 1, content: chalk.blue(header) }] : [],
            colAligns: [firstColumn.columnAlign],
        });
        this.table.push([{ hAlign: firstColumn.headAlign, content: chalk.magenta(firstColumn.content) }])
    }

    addRow (elements = []) {
        const newRowIndex = this.table.length;
        this.table[newRowIndex] = elements;
        return newRowIndex;
    }

    modifyElementHook (element) {
        return element;
    }

    addElementToRow (rowIndex, headKey, element, align = 'right') {
        headKey = chalk.magenta(headKey);
        let columnIndex = this.table[0].indexOf(headKey);
        if(columnIndex === -1) {
            this.table[0].push(headKey);
            columnIndex = this.table[0].length - 1;
            this.table.options.colAligns[columnIndex] = align;
            this.table.options.head[0].colSpan++;
        }
        this.table[rowIndex].push(this.modifyElementHook(element));
    }

    compareElementsHook (element1, element2) {
        return element1 - element2;
    }

    toString () {
        for (let i = 1; i < this.table.length; i++) {
            const row = this.table[i];
            const sortRow = row.slice(1).sort(this.compareElementsHook);
            const best = sortRow[sortRow.length - 1];
            const worst = sortRow[0];
            for (let j = 1; j < row.length; j++) {
                let cellColor;
                switch (row[j]) {
                    case best:
                        cellColor = this.colors.best;
                        break;
                    case worst:
                        cellColor = this.colors.worst;
                        break;
                    default:
                        cellColor = this.colors.neutral;
                }
                this.table[i][j] = chalk[cellColor](this.table[i][j]);
            }
        }
        return this.table.toString();
    }

    setColors (colors) {
        this.colors = colors || this.DEFAULT_COLORS;
    }
}

module.exports = {
    createGasUsedTable,
    compareGasUsedElements,
    displayGasUsedElement,
    GasUsedTable,
}
