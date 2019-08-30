import * as _ from 'lodash';
import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';

import { Headers } from '../../types';
import { styled } from '../../styles';
import { HEADER_NAME_PATTERN } from '../../model/http-docs';

import { clickOnEnter } from '../component-utils';
import { Button, TextInput } from './inputs';
import { FontAwesomeIcon } from '../../icons';

export type HeadersArray = Array<[string, string]>;

export const headersToHeadersArray = (headers: Headers) =>
    Object.entries(headers || {}).reduce(
        (acc: Array<[string, string]>, [key, value]) => {
            if (_.isArray(value)) {
                acc = acc.concat(value.map(v => [key, v]))
            } else {
                acc.push([key, value || '']);
            }
            return acc;
        }, []
    );

interface EditableHeadersProps {
    headers: HeadersArray;
    onChange: (headers: HeadersArray) => void;
}

const HeadersContainer = styled.div`
    margin-top: 5px;

    display: grid;
    grid-gap: 5px;
    grid-template-columns: 1fr 2fr auto;

    > :last-child {
        grid-column: 2 / span 2;
    }
`;


const HeaderDeleteButton = styled(Button)`
    font-size: ${p => p.theme.textSize};
    padding: 3px 10px 5px;
`;

export const EditableHeaders = observer((props: EditableHeadersProps) => {
    const { headers, onChange } = props;

    return <HeadersContainer>
        { _.flatMap(headers, ([key, value], i) => [
            <TextInput
                value={key}
                required
                pattern={HEADER_NAME_PATTERN}
                spellCheck={false}
                key={`${i}-key`}
                onChange={action((event: React.ChangeEvent<HTMLInputElement>) => {
                    headers[i][0] = event.target.value;
                    onChange(headers);
                })}
            />,
            <TextInput
                value={value}
                invalid={!value}
                spellCheck={false}
                key={`${i}-val`}
                onChange={action((event: React.ChangeEvent<HTMLInputElement>) => {
                    headers[i][1] = event.target.value;
                    onChange(headers);
                })}
            />,
            <HeaderDeleteButton
                key={`${i}-del`}
                onClick={action(() => {
                    headers.splice(i, 1);
                    onChange(headers);
                })}
                onKeyPress={clickOnEnter}
            >
                <FontAwesomeIcon icon={['far', 'trash-alt']} />
            </HeaderDeleteButton>
        ]).concat([
            <TextInput
                value=''
                pattern={HEADER_NAME_PATTERN}
                placeholder='Header name'
                spellCheck={false}
                key={`${headers.length}-key`}
                onChange={action((event: React.ChangeEvent<HTMLInputElement>) => {
                    headers.push([event.target.value, '']);
                    onChange(headers);
                })}
            />,
            <TextInput
                value=''
                placeholder='Header value'
                spellCheck={false}
                key={`${headers.length}-val`}
                onChange={action((event: React.ChangeEvent<HTMLInputElement>) => {
                    headers.push(['', event.target.value]);
                    onChange(headers);
                })}
            />
        ]) }
    </HeadersContainer>
});