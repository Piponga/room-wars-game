export const config = {
    host: {
        url: PRODUCTION ? 'https://arcane-lowlands-79462.herokuapp.com/' : 'http://localhost:5000'
    },
    world: {
        fov: 1.5
    },
    ships: {
        newbie: {
            speed: 900,
            hp: 100,
            rotateSpeed: 1,
            angularSensibility: 700,
            inertia: 0.92
        }
    },
    weapons: {
        newbie: {
            bulletType: 'green-small',
            bulletSpeed: 3600,
            bulletPower: 20,
            shotDelay: 250,
            shotDistance: 3000
        }
    }
};