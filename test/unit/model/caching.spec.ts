import * as dedent from "dedent";

import { getExchangeData, expect, httpDate } from "../../test-setup";

import { explainCacheability } from "../../../src/model/caching";

describe('Caching explanations', () => {
    describe('given a GET 200 with no explicit headers', () => {
        const exchange = getExchangeData();

        it("should say that it's probably not cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Typically not cacheable'
            );
        });

        it("should explain why it's probably not cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.type).to.equal('warning');
            expect(result!.explanation).to.include('200 responses are cacheable by default');
            expect(result!.explanation.replace('\n', ' ')).to.include(
                'most caches will not store a response like this'
            );
        });
    });

    describe('given a GET 200 with an explicit max-age and etag', () => {
        const exchange = getExchangeData({
            responseHeaders: {
                'date': httpDate(new Date()),
                'etag': 'tagtagtag',
                'cache-control': 'max-age=60'
            }
        });

        it("should say that it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Cacheable'
            );
        });

        it("should not include any suggestions", () => {
            const result = explainCacheability(exchange);
            expect(result!.type).to.equal(undefined);
            expect(result!.explanation).not.to.include('validation');
        });
    });

    describe('given a GET 200 with an explicit max-age', () => {
        const exchange = getExchangeData({
            responseHeaders: {
                'date': httpDate(new Date()),
                'cache-control': 'max-age=60'
            }
        });

        it("should say that it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Cacheable'
            );
        });

        it("should explain why it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include('max-age');
        });

        it("should suggest adding validation headers", () => {
            const result = explainCacheability(exchange);
            expect(result!.type).to.equal('suggestion');
            expect(result!.explanation).to.include('ETag');
        });
    });

    describe('given a GET 200 with a max-age of one year', () => {
        const exchange = getExchangeData({
            responseHeaders: {
                'date': httpDate(new Date()),
                'etag': 'fedcba',
                'cache-control': 'max-age=31536000'
            }
        });

        it("should say that it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Cacheable'
            );
        });

        it("should explain why it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include('max-age');
        });

        it("should suggest adding an immutable directive", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include('immutable');
            expect(result!.type).to.equal('suggestion');
        });
    });

    describe('given a GET 200 with an explicit max-age but no Date header', () => {
        const exchange = getExchangeData({
            responseHeaders: {
                'cache-control': 'max-age=60'
            }
        });

        it("should say that it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Cacheable'
            );
        });

        it("should explain why it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include('max-age');
        });

        it("should strongly suggest including a Date header", () => {
            const result = explainCacheability(exchange);
            expect(result!.type).to.equal('warning');
            expect(result!.explanation).to.include('Date');
        });
    });

    describe('given a GET 200 with an Expires header', () => {
        const exchange = getExchangeData({
            responseHeaders: {
                'expires': 'Thu, 1 Jan 2099 00:00:00 GMT'
            }
        });

        it("should say that it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Cacheable'
            );
        });

        it("should explain why it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include('Expires');
        });

        it("should suggest using max-age instead", () => {
            const result = explainCacheability(exchange);
            expect(result!.type).to.equal('suggestion');
            expect(result!.explanation).to.include('max-age');
        });
    });

    describe('given a GET 500 with only a s-maxage', () => {
        const exchange = getExchangeData({
            statusCode: 500,
            responseHeaders: {
                'cache-control': 's-maxage=60'
            }
        });

        it("should say that it's not cacheable by clients", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Not cacheable by private (HTTP client) caches'
            );
        });

        it("should explain why it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include('s-maxage');
        });
    });

    describe('given a GET 200 with conflicting max age & Expires', () => {
        const exchange = getExchangeData({
            responseHeaders: {
                'cache-control': 'max-age=60',
                'expires': 'Thu, 01 Jan 2099 00:00:00 GMT'
            }
        });

        it("should say that it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Cacheable'
            );
        });

        it("should explain why it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include('max-age');
        });

        it("should warn about the conflict", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include('max-age');
        });
    });

    describe('given a 401 GET with an explicit public directive and ETag', () => {
        const exchange = getExchangeData({
            statusCode: 401,
            responseHeaders: {
                'cache-control': 'public',
                'etag': 'abcdef'
            }
        });

        it("should say that it's probably cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Probably cacheable'
            );
        });

        it("should suggest more explicit cache headers", () => {
            const result = explainCacheability(exchange);
            expect(result!.type).to.equal('warning');
            expect(result!.explanation).to.include('`public` Cache-Control directive');
            expect(result!.explanation.replace('\n', ' ')).to.include(
                'expiry behaviour is not well specified'
            );
        });
    });

    describe('given a 200 GET with a Last-Modified header', () => {
        const exchange = getExchangeData({
            responseHeaders: {
                'last-modified': 'Fri, 22 Mar 2019 11:54:00 GMT'
            }
        });

        it("should say that it's probably cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Probably cacheable'
            );
        });

        it("should suggest more explicit cache headers", () => {
            const result = explainCacheability(exchange);
            expect(result!.type).to.equal('warning');
            expect(result!.explanation).to.include('200 responses are cacheable by default');
            expect(result!.explanation.replace('\n', ' ')).to.include(
                'expiry behaviour is not well specified'
            );
        });
    });

    describe('given a GET 500 error with no explicit headers', () => {
        const exchange = getExchangeData({
            statusCode: 500
        });

        it("should say that it's not cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal('Not cacheable');
        });

        it("should explain why it's not cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include('500');
        });
    });

    describe('given a GET 200 with a no-store response directive', () => {
        const exchange = getExchangeData({
            responseHeaders: {
                'cache-control': 'no-store'
            }
        });

        it("should say that it's not cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Not cacheable'
            );
        });

        it("should explain why it's not cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include('no-store');
        });
    });

    describe('given a GET 200 with a no-store pragma directive', () => {
        const exchange = getExchangeData({
            responseHeaders: {
                'pragma': 'no-store'
            }
        });

        it("should say that it's not cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Not cacheable'
            );
        });

        it("should explain why it's not cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include('no-store');
        });

        it("should suggest moving to cache-control", () => {
            const result = explainCacheability(exchange);
            expect(result!.type).to.equal('suggestion');
            expect(result!.explanation).to.include('Pragma');
        });
    });

    describe('given a POST with no explicit headers', () => {
        const exchange = getExchangeData({
            method: 'POST'
        });

        it("should say that it's not cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Not cacheable'
            );
        });

        it("should explain why it's not cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include(
                'POST responses are not typically cacheable'
            );
            expect(result!.explanation).to.include(
                'This response does not fulfill those conditions'
            );
        });
    });

    describe('given a POST with proper caching headers', () => {
        const exchange = getExchangeData({
            method: 'POST',
            path: '/abc',
            query: '?a=b',
            responseHeaders: {
                'cache-control': 'public, max-age=10000',
                'content-location': '/abc?a=b'
            }
        });

        it("should say that it's possibly cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'May be cacheable for future GET/HEAD requests'
            );
        });

        it("should explain why it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include(
                'POST responses are not typically cacheable'
            );
            expect(result!.explanation).to.include(
                'This response fulfills those conditions'
            );
        });
    });

    describe('given a DELETE with no explicit headers', () => {
        const exchange = getExchangeData({
            method: 'DELETE'
        });

        it("should say that it's not cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Not cacheable'
            );
        });

        it("should explain why it's not cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include(
                'DELETE requests are never cacheable'
            );
        });
    });

    describe('given an OPTIONS CORS response with no explicit headers', () => {
        const exchange = getExchangeData({
            method: 'OPTIONS',
            requestHeaders: {
                origin: 'http://example2.com'
            }
        });

        it("should say that it's only briefly cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Very briefly cacheable'
            );
        });

        it("should explain why it's only briefly cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation.replace('\n', ' ')).to.include(dedent`
                OPTIONS preflight requests are not cacheable, unless an
                Access-Control-Max-Age header is provided
            `.replace('\n', ' '));
        });
    });

    describe('given an OPTIONS CORS response with Access-Control-Max-Age', () => {
        const exchange = getExchangeData({
            method: 'OPTIONS',
            requestHeaders: {
                origin: 'http://example2.com'
            },
            responseHeaders: {
                'access-control-max-age': '600'
            }
        });

        it("should say that it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal(
                'Cacheable'
            );
        });

        it("should explain why it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation.replace(/\n/g, ' ')).to.include(
                'will be cached if a Access-Control-Max-Age header is provided, as here'
            );
        });
    });

    describe('given a permanent redirect with no explicit headers', () => {
        const exchange = getExchangeData({
            statusCode: 301
        });

        it("should say it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal('Cacheable');
        });

        it("should explain why it's cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include(
                '301 responses are cacheable by default'
            );
            expect(result!.explanation.replace(/\n/g, ' ')).to.include(
                'clients will cache it forever'
            );
        });
    });

    describe('given a 200 GET with an ETag and Vary: *', () => {
        const exchange = getExchangeData({
            responseHeaders: {
                etag: '123abc',
                vary: '*'
            }
        });

        it("should say it's not cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.summary).to.equal('Not cacheable');
        });

        it("should explain why it's not cacheable", () => {
            const result = explainCacheability(exchange);
            expect(result!.explanation).to.include('Vary');
        });
    });
});