import { Vector3 } from 'babylonjs';
// import { Curve } from '../core/Curve.js';

/**
 * @author zz85 https://github.com/zz85
 *
 * Centripetal CatmullRom Curve - which is useful for avoiding
 * cusps and self-intersections in non-uniform catmull rom curves.
 * http://www.cemyuksel.com/research/catmullrom_param/catmullrom.pdf
 *
 * curve.type accepts centripetal(default), chordal and catmullrom
 * curve.tension is used for catmullrom which defaults to 0.5
 */


/*
 Based on an optimized c++ solution in
 - http://stackoverflow.com/questions/9489736/catmull-rom-curve-with-no-cusps-and-no-self-intersections/
 - http://ideone.com/NoEbVM

 This CubicPoly class could be used for reusing some variables and calculations,
 but for three.js curve use, it could be possible inlined and flatten into a single function call
 which can be placed in CurveUtils.
 */

function subVectors( a, b ) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;

    return this;
}

function CubicPoly() {

    let c0 = 0, c1 = 0, c2 = 0, c3 = 0;

    /*
     * Compute coefficients for a cubic polynomial
     *   p(s) = c0 + c1*s + c2*s^2 + c3*s^3
     * such that
     *   p(0) = x0, p(1) = x1
     *  and
     *   p'(0) = t0, p'(1) = t1.
     */
    function init( x0, x1, t0, t1 ) {

        c0 = x0;
        c1 = t0;
        c2 = - 3 * x0 + 3 * x1 - 2 * t0 - t1;
        c3 = 2 * x0 - 2 * x1 + t0 + t1;

    }

    return {

        initCatmullRom: function ( x0, x1, x2, x3, tension ) {

            init( x1, x2, tension * ( x2 - x0 ), tension * ( x3 - x1 ) );

        },

        initNonuniformCatmullRom: function ( x0, x1, x2, x3, dt0, dt1, dt2 ) {

            // compute tangents when parameterized in [t1,t2]
            let t1 = ( x1 - x0 ) / dt0 - ( x2 - x0 ) / ( dt0 + dt1 ) + ( x2 - x1 ) / dt1;
            let t2 = ( x2 - x1 ) / dt1 - ( x3 - x1 ) / ( dt1 + dt2 ) + ( x3 - x2 ) / dt2;

            // rescale tangents for parametrization in [0,1]
            t1 *= dt1;
            t2 *= dt1;

            init( x1, x2, t1, t2 );

        },

        calc: function ( t ) {

            let t2 = t * t;
            let t3 = t2 * t;
            return c0 + c1 * t + c2 * t2 + c3 * t3;

        }

    };

}

//

Vector3.prototype.subVectors = function ( a, b ) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    return this;
};

Vector3.prototype.distanceToSquared = function ( v ) {
    let dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;
    return dx * dx + dy * dy + dz * dz;
};
// Vector3.prototype.normalize = function () {
//     return this.divideScalar( this.length() || 1 );
// };

const tmp = new Vector3();
const px = new CubicPoly(), py = new CubicPoly(), pz = new CubicPoly();

function CatmullRomCurve3( points, closed, curveType, tension ) {

    // Curve.call( this );

    this.type = 'CatmullRomCurve3';

    this.points = points || [];
    this.closed = closed || true;
    this.curveType = curveType || 'centripetal';
    this.tension = tension || 0.5;
    this.arcLengthDivisions = 200;
}

// CatmullRomCurve3.prototype = Object.create( Curve.prototype );
CatmullRomCurve3.prototype.constructor = CatmullRomCurve3;

CatmullRomCurve3.prototype.isCatmullRomCurve3 = true;

CatmullRomCurve3.prototype.getPoint = function ( t, optionalTarget ) {

    let point = optionalTarget || new Vector3();

    let points = this.points;
    let l = points.length;

    let p = ( l - ( this.closed ? 0 : 1 ) ) * t;
    let intPoint = Math.floor( p );
    let weight = p - intPoint;

    if ( this.closed ) {

        intPoint += intPoint > 0 ? 0 : ( Math.floor( Math.abs( intPoint ) / l ) + 1 ) * l;

    } else if ( weight === 0 && intPoint === l - 1 ) {

        intPoint = l - 2;
        weight = 1;

    }

    let p0, p1, p2, p3; // 4 points

    if ( this.closed || intPoint > 0 ) {

        p0 = points[ ( intPoint - 1 ) % l ];

    } else {

        // extrapolate first point
        tmp.subVectors( points[ 0 ], points[ 1 ] ).add( points[ 0 ] );
        p0 = tmp;

    }

    p1 = points[ intPoint % l ];
    p2 = points[ ( intPoint + 1 ) % l ];

    if ( this.closed || intPoint + 2 < l ) {

        p3 = points[ ( intPoint + 2 ) % l ];

    } else {

        // extrapolate last point
        tmp.subVectors( points[ l - 1 ], points[ l - 2 ] ).add( points[ l - 1 ] );
        p3 = tmp;

    }

    if ( this.curveType === 'centripetal' || this.curveType === 'chordal' ) {

        // init Centripetal / Chordal Catmull-Rom
        let pow = this.curveType === 'chordal' ? 0.5 : 0.25;
        let dt0 = Math.pow( p0.distanceToSquared( p1 ), pow );
        let dt1 = Math.pow( p1.distanceToSquared( p2 ), pow );
        let dt2 = Math.pow( p2.distanceToSquared( p3 ), pow );

        // safety check for repeated points
        if ( dt1 < 1e-4 ) dt1 = 1.0;
        if ( dt0 < 1e-4 ) dt0 = dt1;
        if ( dt2 < 1e-4 ) dt2 = dt1;

        px.initNonuniformCatmullRom( p0.x, p1.x, p2.x, p3.x, dt0, dt1, dt2 );
        py.initNonuniformCatmullRom( p0.y, p1.y, p2.y, p3.y, dt0, dt1, dt2 );
        pz.initNonuniformCatmullRom( p0.z, p1.z, p2.z, p3.z, dt0, dt1, dt2 );

    } else if ( this.curveType === 'catmullrom' ) {

        px.initCatmullRom( p0.x, p1.x, p2.x, p3.x, this.tension );
        py.initCatmullRom( p0.y, p1.y, p2.y, p3.y, this.tension );
        pz.initCatmullRom( p0.z, p1.z, p2.z, p3.z, this.tension );

    }

    point.set(
        px.calc( weight ),
        py.calc( weight ),
        pz.calc( weight )
    );

    return point;

};

// Returns a unit vector tangent at t
// In case any sub curve does not implement its tangent derivation,
// 2 points a small delta apart will be used to find its gradient
// which seems to give a reasonable approximation

CatmullRomCurve3.prototype.getTangent = function ( t ) {

    let delta = 0.0001;
    let t1 = t - delta;
    let t2 = t + delta;

    // Capping in case of danger
    if ( t1 < 0 ) t1 = 0;
    if ( t2 > 1 ) t2 = 1;

    let pt1 = this.getPoint( t1 );
    let pt2 = this.getPoint( t2 );

    let vec = pt2.clone().subtract( pt1 );
    // return vec.normalize();
    return Vector3.Normalize(vec);
};

CatmullRomCurve3.prototype.getLength = function () {
    let lengths = this.getLengths();
    return lengths[ lengths.length - 1 ];
};

CatmullRomCurve3.prototype.getLengths = function ( divisions ) {

    if ( divisions === undefined ) divisions = this.arcLengthDivisions;

    if ( this.cacheArcLengths &&
        ( this.cacheArcLengths.length === divisions + 1 ) &&
        ! this.needsUpdate ) {

        return this.cacheArcLengths;

    }

    this.needsUpdate = false;

    let cache = [];
    let current, last = this.getPoint( 0 );
    let p, sum = 0;

    cache.push( 0 );

    for ( p = 1; p <= divisions; p ++ ) {

        current = this.getPoint( p / divisions );
        // sum += current.distanceTo( last );
        sum += Vector3.Distance(current, last);
        cache.push( sum );
        last = current;

    }

    this.cacheArcLengths = cache;

    return cache; // { sums: cache, sum: sum }; Sum is in the last element.
};

export { CatmullRomCurve3 };