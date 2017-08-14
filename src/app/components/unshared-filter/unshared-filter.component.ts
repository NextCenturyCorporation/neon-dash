import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import {DatabaseMetaData, FieldMetaData, TableMetaData} from '../../dataset';

@Component({
    selector: 'app-unshared-filter',
    templateUrl: './unshared-filter.component.html',
    styleUrls: ['./unshared-filter.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnsharedFilterComponent {
    @Input() public meta: {
        databases: DatabaseMetaData[],
        database: DatabaseMetaData,
        tables: TableMetaData[],
        table: TableMetaData,
        unsharedFilterField: FieldMetaData,
        unsharedFilterValue: string,
        fields: FieldMetaData[]
    };

    @Output() unsharedFilterFieldChanged = new EventEmitter<any>();
    @Output() unsharedFilterRemoved = new EventEmitter<void>();
    @Output() unsharedFilterValueChanged = new EventEmitter<string>();

    handleChangeUnsharedFilterField(): void {
        this.unsharedFilterFieldChanged.emit(this.meta.unsharedFilterField);
    }

    handleRemoveUnsharedFilter(): void {
        this.meta.unsharedFilterValue = null;
        this.meta.unsharedFilterField = new FieldMetaData();
        this.unsharedFilterRemoved.emit();
    }

    handleChangeUnsharedFilterValue(): void {
        this.unsharedFilterValueChanged.emit(this.meta.unsharedFilterValue);
    }
}
