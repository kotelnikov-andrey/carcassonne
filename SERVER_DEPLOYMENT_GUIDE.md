# Server Deployment Guide for Carcassonne Game

This guide will walk you through deploying your Carcassonne game on a server so your team members can collaborate on the project.

## Part 1: Evaluating the Current Database Schema

### Current Migration Analysis

The current migration creates a single `games` table with the following structure:

```javascript
table.string('game_id', 20).primary().notNullable();
table.jsonb('game_state').notNullable();
table.enum('status', ['waiting', 'active', 'finished']).defaultTo('waiting');
table.timestamp('created_at').defaultTo(knex.fn.now());
table.timestamp('updated_at').defaultTo(knex.fn.now());
```

This schema is sufficient for the current implementation because:

1. It uses a single JSON field (`game_state`) to store all game data, which is what you requested
2. It includes a status field for tracking game state
3. It includes timestamps for tracking when games are created and updated

### Do We Need Additional Tables?

For the current implementation, no additional tables are needed. The JSON-based approach is:

- **Simple**: All game data is in one place
- **Flexible**: You can modify the game structure without changing the database schema
- **Sufficient**: For a game like Carcassonne with a moderate number of players and games

If you later decide to scale the application or need more complex queries, you might consider:

- A separate `players` table for user accounts
- A `game_players` junction table for many-to-many relationships
- A `tiles` table for tracking placed tiles

But for now, the current schema is adequate.

## Part 2: Renting a Server and Setting Up the Database

### Step 1: Choose a Cloud Provider

Several cloud providers offer virtual servers. Here are options based on your location:

#### Options Accessible Worldwide (Including Russia)

1. **Selectel** (Recommended for Russian users)
   - Russian cloud provider with data centers in Russia
   - Complies with Russian data regulations
   - Offers VPS and dedicated servers
   - Website: [Selectel](https://selectel.ru/)

2. **Timeweb**
   - Russian hosting provider
   - Affordable VPS options
   - Good technical support in Russian
   - Website: [Timeweb](https://timeweb.com/)

3. **Beget**
   - Russian hosting with VPS options
   - User-friendly control panel
   - Good for beginners
   - Website: [Beget](https://beget.com/)

4. **Reg.ru**
   - Popular Russian hosting provider
   - Various VPS configurations
   - Website: [Reg.ru](https://reg.ru/)

5. **Hetzner** (German provider, often accessible in Russia)
   - European provider with good pricing
   - Data centers in Germany and Finland
   - Website: [Hetzner](https://www.hetzner.com/)

#### Options for Users Outside Russia

1. **DigitalOcean** (Recommended for beginners outside Russia)
   - Simple pricing model
   - User-friendly interface
   - Good documentation
   - Note: May have restrictions for Russian users

2. **AWS (Amazon Web Services)**
   - More features but more complex
   - Free tier available for 12 months
   - Widely used in industry
   - Note: Has restrictions for Russian users

3. **Google Cloud Platform**
   - Similar to AWS
   - Free tier available
   - Good integration with other Google services
   - Note: Has restrictions for Russian users

4. **Heroku**
   - Very easy to deploy
   - Free tier available (with limitations)
   - Less control over the server
   - Note: Has restrictions for Russian users

For this guide, we'll provide instructions that work with any provider, with specific notes for Selectel (for Russian users) and DigitalOcean (for users outside Russia).

### Step 2: Create an Account

#### Option A: Selectel (For Russian Users)

1. Go to [Selectel](https://selectel.ru/)
2. Click "Регистрация" (Registration)
3. Fill in your details and create an account
4. Add a payment method (credit card, electronic payment, or bank transfer)

#### Option B: DigitalOcean (For Users Outside Russia)

1. Go to [DigitalOcean](https://www.digitalocean.com/)
2. Sign up for an account
3. Add a payment method

### Step 3: Create a Virtual Server

#### Option A: Creating a VPS on Selectel

1. Sign in to your Selectel account
2. Navigate to "Облачная платформа" → "Виртуальные машины" (Cloud Platform → Virtual Machines)
3. Click "Создать ВМ" (Create VM)
4. Choose configuration:
   - Operating System: **Ubuntu 22.04 LTS**
   - Configuration: 1-2 vCPU, 2GB RAM, 20GB storage (minimum recommended)
   - Network: Create a new network or use existing
   - Location: Choose a data center in Russia for best performance
5. Authentication: SSH keys (recommended) or Password
   - If using SSH keys, add your public key in the appropriate field
6. Set a name for your server (e.g., `carcassonne-game-server`)
7. Click "Создать" (Create)

#### Option B: Creating a Droplet on DigitalOcean

1. From the DigitalOcean dashboard, click "Create" → "Droplets"
2. Choose an image: **Ubuntu 22.04 LTS**
3. Choose a plan:
   - Basic plan
   - Regular CPU (not dedicated)
   - $5/month (1GB RAM, 1 CPU, 25GB SSD) is sufficient for development
4. Choose a datacenter region close to your team (e.g., Frankfurt for Europe)
5. Authentication: SSH keys (recommended) or Password
   - If using SSH keys, follow DigitalOcean's guide to create and add your key
6. Choose a hostname (e.g., `carcassonne-game-server`)
7. Click "Create Droplet"

### Step 4: Connect to Your Server

For both Selectel and DigitalOcean, you'll need to find your server's IP address in your provider's dashboard.

#### For Selectel:
- Go to "Облачная платформа" → "Виртуальные машины" (Cloud Platform → Virtual Machines)
- Find your server in the list and note its IP address

#### For DigitalOcean:
- Go to the Droplets section
- Find your droplet in the list and note its IP address

#### Using SSH (Mac/Linux):

```bash
# If you used a password during setup
ssh root@your_server_ip

# If you used SSH keys
ssh -i /path/to/your/private_key root@your_server_ip
```

#### Using PuTTY (Windows):
1. Download and install [PuTTY](https://www.putty.org/)
2. Enter your server IP in the "Host Name" field
3. If using SSH keys, configure them in Connection → SSH → Auth → Credentials
4. Click "Open" and enter your credentials if prompted

### Step 5: Install Required Software

Once connected to your server, install the necessary software:

```bash
# Update package lists
apt update
apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Git
apt install -y git

# Install PM2 (for running Node.js in production)
npm install -g pm2
```

### Step 6: Configure PostgreSQL

1. Switch to the postgres user:
   ```bash
   sudo -i -u postgres
   ```

2. Create a database and user:
   ```bash
   createuser --interactive --pwprompt carcassonne
   # Enter password when prompted (e.g., use a strong password)
   
   createdb --owner=carcassonne carcassonne
   ```

3. Exit the postgres user:
   ```bash
   exit
   ```

4. Configure PostgreSQL to allow password authentication:
   ```bash
   # For PostgreSQL 16 (check your version with 'psql --version')
   sudo nano /etc/postgresql/16/main/pg_hba.conf
   
   # If the file is not found, locate it with:
   sudo find /etc -name "pg_hba.conf"
   ```
   
   > **Important:** The path to pg_hba.conf depends on your PostgreSQL version. The guide shows version 16, but adjust the path based on your installed version (e.g., `/etc/postgresql/14/main/pg_hba.conf` for PostgreSQL 14).
   
   > **Note:** The `pg_hba.conf` file is NOT empty. It's PostgreSQL's client authentication configuration file and contains many lines of configuration and comments. You'll need to scroll down to find the specific line to modify.
   
   The file will look something like this (with many more lines and comments):
   
   ```
   # TYPE  DATABASE        USER            ADDRESS                 METHOD
   
   # "local" is for Unix domain socket connections only
   local   all             all                                     peer
   # IPv4 local connections:
   host    all             all             127.0.0.1/32            scram-sha-256
   # IPv6 local connections:
   host    all             all             ::1/128                 scram-sha-256
   ```
   
   Find the line that looks like:
   ```
   local   all             all                                     peer
   ```
   
   And change it to:
   ```
   local   all             all                                     md5
   ```
   
   **What this change does:**
   
   - The `pg_hba.conf` file controls how PostgreSQL authenticates clients
   - The `local` line controls connections made through Unix domain sockets (local connections)
   - Changing from `peer` to `md5` authentication method means:
     - `peer`: Authentication based on the operating system user (requires the database user to match the OS user)
     - `md5`: Password-based authentication using MD5 hashing
   
   This change allows your application to connect to PostgreSQL using a username and password, rather than requiring the OS user to match the database user. Without this change, your Node.js application wouldn't be able to connect to PostgreSQL using the credentials you specified.

5. Restart PostgreSQL:
   ```bash
   sudo systemctl restart postgresql
   ```

## Part 3: Deploying Your Application

### Step 1: Clone Your Repository

1. Create a directory for your application:
   ```bash
   mkdir -p /var/www
   cd /var/www
   ```

2. Clone your repository:
   ```bash
   git clone https://github.com/yourusername/carcassonne.git
   cd carcassonne
   ```

   If your repository is private, you'll need to set up SSH keys or use HTTPS with a personal access token.

### Step 2: Install Dependencies

```bash
# Install backend dependencies
cd carcassonne-server
npm install

# Install frontend dependencies (if needed)
cd ../carcassonne-frontend
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the server directory:

```bash
cd /var/www/carcassonne/carcassonne-server
nano .env
```

Add the following content (replace with your actual values):

```
PORT=8080
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_USER=carcassonne
DB_PASSWORD=your_password_here
DB_NAME=carcassonne
JWT_SECRET=your_jwt_secret_here
```

### Step 4: Run Database Migrations

```bash
cd /var/www/carcassonne/carcassonne-server
npx knex migrate:latest
```

### Step 5: Start the Application with PM2

```bash
cd /var/www/carcassonne/carcassonne-server
pm2 start server.js --name "carcassonne-server"

# If you want to start the frontend as well (assuming it's a React app)
cd /var/www/carcassonne/carcassonne-frontend
pm2 start npm --name "carcassonne-frontend" -- start
```

### Step 6: Configure PM2 to Start on Boot

```bash
pm2 startup
# Follow the instructions provided by the command
pm2 save
```

### Step 7: Set Up Nginx as a Reverse Proxy (Optional but Recommended)

1. Install Nginx:
   ```bash
   apt install -y nginx
   ```

2. Create a configuration file:
   ```bash
   nano /etc/nginx/sites-available/carcassonne
   ```

3. Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name your_server_ip_or_domain;

       location /api {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           rewrite ^/api/(.*) /$1 break;
       }

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Enable the site:
   ```bash
   ln -s /etc/nginx/sites-available/carcassonne /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

## Part 4: Setting Up Continuous Deployment (Optional)

For easier updates, you can set up a simple deployment script:

1. Create a deployment script:
   ```bash
   nano /var/www/deploy.sh
   ```

2. Add the following content:
   ```bash
   #!/bin/bash
   cd /var/www/carcassonne
   git pull
   cd carcassonne-server
   npm install
   npx knex migrate:latest
   pm2 restart carcassonne-server
   cd ../carcassonne-frontend
   npm install
   npm run build
   pm2 restart carcassonne-frontend
   ```

3. Make the script executable:
   ```bash
   chmod +x /var/www/deploy.sh
   ```

4. Run the script whenever you want to deploy updates:
   ```bash
   /var/www/deploy.sh
   ```

## Part 5: Collaborating with Team Members

### Option 1: Direct Server Access

Give team members SSH access to the server:

1. Each team member generates an SSH key
2. Add their public keys to `/root/.ssh/authorized_keys` on the server
3. They can then connect using `ssh root@your_server_ip`

### Option 2: GitHub Workflow

1. Team members clone the repository locally
2. They create branches for their features
3. They push changes and create pull requests
4. After reviewing, merge changes to the main branch
5. Run the deployment script to update the server

### Option 3: Database Access for Team Members

To give team members direct access to the database:

1. Configure PostgreSQL to allow remote connections:
   ```bash
   # For PostgreSQL 16 (check your version with 'psql --version')
   sudo nano /etc/postgresql/16/main/postgresql.conf
   ```
   
   Find and uncomment:
   ```
   #listen_addresses = 'localhost'
   ```
   
   Change to:
   ```
   listen_addresses = '*'
   ```

2. Allow connections in pg_hba.conf:
   ```bash
   # For PostgreSQL 16 (check your version with 'psql --version')
   sudo nano /etc/postgresql/16/main/pg_hba.conf
   ```
   
   Add at the end:
   ```
   host    all             all             0.0.0.0/0               md5
   ```

3. Restart PostgreSQL:
   ```bash
   sudo systemctl restart postgresql
   ```

4. Configure firewall to allow PostgreSQL connections:
   ```bash
   sudo ufw allow 5432/tcp
   ```

5. Team members can now connect using tools like pgAdmin with:
   - Host: your_server_ip
   - Port: 5432
   - Database: carcassonne
   - Username: carcassonne
   - Password: your_password_here

## Security Considerations

1. **Firewall**: Configure UFW (Uncomplicated Firewall):
   ```bash
   ufw allow OpenSSH
   ufw allow 'Nginx Full'
   ufw allow 5432/tcp  # Only if you want remote database access
   ufw enable
   ```

2. **Regular Updates**:
   ```bash
   apt update && apt upgrade -y
   ```

3. **Secure Passwords**: Use strong, unique passwords for all services

4. **HTTPS**: Consider setting up SSL with Let's Encrypt:
   ```bash
   apt install certbot python3-certbot-nginx
   certbot --nginx -d yourdomain.com
   ```

## Monitoring and Maintenance

1. **Check Logs**:
   ```bash
   pm2 logs
   ```

2. **Monitor Server Status**:
   ```bash
   pm2 status
   ```

3. **Database Backups**:
   ```bash
   pg_dump -U carcassonne carcassonne > backup_$(date +%Y%m%d).sql
   ```

4. **Automate Backups** (add to crontab):
   ```bash
   0 0 * * * pg_dump -U carcassonne carcassonne > /var/backups/carcassonne_$(date +\%Y\%m\%d).sql
   ```

## Conclusion

You now have a fully deployed Carcassonne game with:
- A virtual server running Ubuntu
- PostgreSQL database for game storage
- Node.js backend with PM2 for process management
- Optional Nginx reverse proxy for better security and performance
- Collaboration options for your team members

This setup provides a solid foundation for your team to collaborate on the project while maintaining a stable production environment.