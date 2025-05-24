import {Link, Navigate, useOutlet} from 'react-router-dom';
import {useAuth} from '../../hooks/useAuth';

export const ProtectedLayout = () => {
    const {user} = useAuth();
    const outlet = useOutlet();

    if (!user) {
        return <Navigate to="/" />;
    }

    return (
        <div>
            <nav>
                <Link to="/dashboard/profile">Profile</Link>
                <Link to="/dashboard/settings">Settings</Link>
            </nav>
            <div>
                {outlet}
            </div>
        </div>
    );
};

export default ProtectedLayout;
